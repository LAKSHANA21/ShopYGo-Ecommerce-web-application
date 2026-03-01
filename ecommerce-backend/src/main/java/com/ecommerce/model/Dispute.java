package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "disputes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Long orderItemId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long sellerId;

    @Column(nullable = false, length = 500)
//    @Size(min = 10, max = 500, message = "Dispute reason must be between 10 and 500 characters")
    private String disputeReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisputeStatus status;

    @Column(length = 1000)
//    @Size(max = 1000, message = "Resolution note cannot exceed 1000 characters")
    private String resolutionNote;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        this.status = DisputeStatus.OPEN;
    }
}
