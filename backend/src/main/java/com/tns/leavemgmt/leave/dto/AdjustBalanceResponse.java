package com.tns.leavemgmt.leave.dto;

import java.math.BigDecimal;

public class AdjustBalanceResponse {

    private BigDecimal newBalance;

    public AdjustBalanceResponse(BigDecimal newBalance) {
        this.newBalance = newBalance;
    }

    public BigDecimal getNewBalance() { return newBalance; }
    public void setNewBalance(BigDecimal newBalance) { this.newBalance = newBalance; }
}
