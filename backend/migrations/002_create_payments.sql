CREATE TABLE IF NOT EXISTS payments (
  id INT NOT NULL AUTO_INCREMENT,
  order_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method ENUM('CASH', 'BANK_TRANSFER', 'CARD') NOT NULL,
  paid_by INT NOT NULL,
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_order_id (order_id),
  KEY idx_payments_paid_by (paid_by),
  KEY idx_payments_paid_at (paid_at),
  KEY idx_payments_method (payment_method),

  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_payments_paid_by
    FOREIGN KEY (paid_by) REFERENCES users (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT chk_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
