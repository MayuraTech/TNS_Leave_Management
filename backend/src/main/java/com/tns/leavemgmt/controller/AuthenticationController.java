package com.tns.leavemgmt.controller;

import com.tns.leavemgmt.dto.LoginRequest;
import com.tns.leavemgmt.dto.LoginResponse;
import com.tns.leavemgmt.dto.RefreshTokenRequest;
import com.tns.leavemgmt.dto.TokenResponse;
import com.tns.leavemgmt.entity.User;
import com.tns.leavemgmt.exception.LeaveManagementException;
import com.tns.leavemgmt.security.CustomUserDetails;
import com.tns.leavemgmt.security.JwtTokenProvider;
import com.tns.leavemgmt.security.UserDetailsServiceImpl;
import com.tns.leavemgmt.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    @Value("${app.jwt.expiration}")
    private long jwtExpirationMs;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = authenticationService.findByUsernameOrEmail(request.getUsernameOrEmail())
                .orElseThrow(() -> new LeaveManagementException("Invalid credentials", HttpStatus.UNAUTHORIZED));

        if (authenticationService.isAccountLocked(user)) {
            throw new LeaveManagementException(
                    "Account is locked due to too many failed login attempts. Try again later.",
                    HttpStatus.UNAUTHORIZED);
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword()));
        } catch (BadCredentialsException ex) {
            authenticationService.handleFailedLogin(user);
            throw new LeaveManagementException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        authenticationService.handleSuccessfulLogin(user);

        String token = jwtTokenProvider.generateToken(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo(userDetails.getId(), userDetails.getUsername(), roles);
        return ResponseEntity.ok(new LoginResponse(token, jwtExpirationMs / 1000, userInfo));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestBody Map<String, String> body) {
        // JWT is stateless; logout is handled client-side by discarding the token.
        // Server-side token blacklisting can be added here if needed.
        log.debug("Logout requested");
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        String token = request.getToken();

        if (!jwtTokenProvider.validateToken(token)) {
            throw new LeaveManagementException("Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }

        String username = jwtTokenProvider.getUsernameFromToken(token);
        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(username);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        String newToken = jwtTokenProvider.generateToken(authentication);
        return ResponseEntity.ok(new TokenResponse(newToken, jwtExpirationMs / 1000));
    }
}
