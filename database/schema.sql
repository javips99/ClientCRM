-- ============================================================
-- ClientCRM — Esquema de base de datos
-- Motor: MySQL 8.x | Charset: utf8mb4
-- Ejecutar en phpMyAdmin o MySQL Workbench antes de setup.php
-- ============================================================

CREATE DATABASE IF NOT EXISTS clientcrm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clientcrm;

-- ------------------------------------------------------------
-- Tabla: usuarios
-- Cuentas de acceso al CRM
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT          NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: clientes
-- Cartera comercial
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id             INT          NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(150) NOT NULL,
  empresa        VARCHAR(150)          DEFAULT NULL,
  email          VARCHAR(150)          DEFAULT NULL,
  telefono       VARCHAR(20)           DEFAULT NULL,
  estado         ENUM('caliente','tibio','frio','ganado') NOT NULL DEFAULT 'frio',
  valor_estimado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  usuario_id     INT          NOT NULL,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_estado     (estado),
  KEY idx_usuario_id (usuario_id),
  CONSTRAINT fk_clientes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabla: notas
-- Registro de actividad por cliente (1:N)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notas (
  id         INT      NOT NULL AUTO_INCREMENT,
  cliente_id INT      NOT NULL,
  usuario_id INT      NOT NULL,
  contenido  TEXT     NOT NULL,
  creado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cliente_id  (cliente_id),
  KEY idx_usuario_id  (usuario_id),  -- CAMBIO: índice explícito en FK
  CONSTRAINT fk_notas_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE,
  CONSTRAINT fk_notas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
