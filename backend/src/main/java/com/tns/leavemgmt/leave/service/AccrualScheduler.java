package com.tns.leavemgmt.leave.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccrualScheduler {

    private final AccrualService accrualService;

    /**
     * Triggers monthly leave accrual on the 1st of each month at midnight.
     * Cron: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 0 1 1 * *")
    public void runMonthlyAccrual() {
        log.info("AccrualScheduler: triggering monthly leave accrual");
        int count = accrualService.processAccrual();
        log.info("AccrualScheduler: monthly accrual complete, {} records processed", count);
    }
}
