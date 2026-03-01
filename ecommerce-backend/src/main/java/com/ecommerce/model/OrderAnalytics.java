package com.ecommerce.model;

import java.math.BigDecimal;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderAnalytics {
    private Long vendorId;
    private BigDecimal totalSales;
    private long orderCount;
    private long deliveredCount;
}