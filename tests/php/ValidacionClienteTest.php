<?php
/**
 * ValidacionClienteTest.php — Tests para validarCliente()
 *
 * Función bajo test: validarCliente(array $data): string[]
 * (definida en api/clientes.php y replicada en bootstrap.php)
 *
 * Categorías:
 *   [HP]  Happy Path    — datos válidos no generan errores
 *   [EC]  Edge Cases    — límites, nulos, caracteres especiales
 *   [ERR] Error Handling — datos inválidos generan el error correcto
 *   [MCK] Mocks de BD   — test de aislamiento con PDO mockeado
 */

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class ValidacionClienteTest extends TestCase
{
    // ════════════════════════════════════════════════════════════
    // HAPPY PATH — datos completos y válidos
    // ════════════════════════════════════════════════════════════

    /** @test */
    public function deberia_pasar_validacion_con_datos_minimos_correctos(): void
    {
        $data = ['nombre' => 'Marta García', 'estado' => 'caliente'];

        $errores = validarCliente($data);

        $this->assertEmpty($errores, 'No debe haber errores con datos mínimos válidos');
    }

    /** @test */
    public function deberia_pasar_validacion_con_todos_los_campos_correctos(): void
    {
        $data = [
            'nombre'         => 'Carlos Ruiz',
            'empresa'        => 'Soluciones CR',
            'email'          => 'carlos@soluciones.es',
            'telefono'       => '698 765 432',
            'estado'         => 'tibio',
            'valor_estimado' => 5500.00,
        ];

        $errores = validarCliente($data);

        $this->assertEmpty($errores);
    }

    /** @test */
    public function deberia_pasar_validacion_con_todos_los_estados_validos(): void
    {
        foreach (VALID_ESTADOS as $estado) {
            $errores = validarCliente(['nombre' => 'Test', 'estado' => $estado]);
            $this->assertEmpty($errores, "El estado '{$estado}' debería ser válido");
        }
    }

    // ════════════════════════════════════════════════════════════
    // EDGE CASES — límites y valores extremos
    // ════════════════════════════════════════════════════════════

    /** @test */
    public function deberia_fallar_cuando_nombre_esta_vacio(): void
    {
        $errores = validarCliente(['nombre' => '', 'estado' => 'frio']);

        $this->assertNotEmpty($errores);
        $this->assertStringContainsString('nombre', strtolower($errores[0]));
    }

    /** @test */
    public function deberia_fallar_cuando_nombre_solo_contiene_espacios(): void
    {
        $errores = validarCliente(['nombre' => '   ', 'estado' => 'frio']);

        $this->assertNotEmpty($errores);
    }

    /** @test */
    public function deberia_fallar_cuando_nombre_supera_150_caracteres(): void
    {
        $nombreLargo = str_repeat('A', 151);
        $errores     = validarCliente(['nombre' => $nombreLargo, 'estado' => 'frio']);

        $this->assertNotEmpty($errores);
        $this->assertStringContainsString('150', $errores[0]);
    }

    /** @test */
    public function deberia_aceptar_nombre_de_exactamente_150_caracteres(): void
    {
        $nombre150 = str_repeat('A', 150);
        $errores   = validarCliente(['nombre' => $nombre150, 'estado' => 'frio']);

        $this->assertEmpty($errores, 'Un nombre de 150 caracteres exactos debe ser válido');
    }

    /** @test */
    public function deberia_fallar_cuando_valor_estimado_no_es_numerico(): void
    {
        $errores = validarCliente([
            'nombre'         => 'Test',
            'estado'         => 'frio',
            'valor_estimado' => 'no-es-numero',
        ]);

        $this->assertNotEmpty($errores);
        $this->assertStringContainsString('numérico', $errores[0]);
    }

    /** @test */
    public function deberia_aceptar_valor_estimado_en_formato_cadena_numerica(): void
    {
        // "1500.50" es numérico — is_numeric() lo acepta
        $errores = validarCliente([
            'nombre'         => 'Test',
            'estado'         => 'ganado',
            'valor_estimado' => '1500.50',
        ]);

        $this->assertEmpty($errores);
    }

    // ════════════════════════════════════════════════════════════
    // ERROR HANDLING — fallos controlados y mensajes claros
    // ════════════════════════════════════════════════════════════

    /** @test */
    public function deberia_devolver_error_cuando_estado_es_valor_desconocido(): void
    {
        $errores = validarCliente(['nombre' => 'Test', 'estado' => 'muy_caliente']);

        $this->assertNotEmpty($errores);
        $this->assertStringContainsString('Estado no válido', $errores[0]);
    }

    /** @test */
    public function deberia_devolver_error_cuando_estado_no_existe_en_el_array(): void
    {
        $errores = validarCliente(['nombre' => 'Test']);
        // Sin clave 'estado', debe fallar
        $this->assertNotEmpty($errores);
    }

    /** @test */
    public function deberia_devolver_error_cuando_email_tiene_formato_invalido(): void
    {
        $errores = validarCliente([
            'nombre' => 'Test',
            'estado' => 'frio',
            'email'  => 'esto-no-es-un-email',
        ]);

        $this->assertNotEmpty($errores);
        $this->assertStringContainsString('email', strtolower($errores[0]));
    }

    /** @test */
    public function deberia_acumular_multiples_errores_cuando_hay_varios_campos_invalidos(): void
    {
        $errores = validarCliente([
            'nombre' => '',                        // error 1
            'estado' => 'invalido',                // error 2
            'email'  => 'no-es-email',             // error 3
        ]);

        $this->assertGreaterThanOrEqual(2, count($errores),
            'Debe acumular al menos 2 errores cuando hay múltiples campos inválidos'
        );
    }

    /** @test */
    public function deberia_pasar_validacion_cuando_email_esta_vacio(): void
    {
        // Email vacío es válido (campo opcional)
        $errores = validarCliente([
            'nombre' => 'Test',
            'estado' => 'frio',
            'email'  => '',
        ]);

        $this->assertEmpty($errores);
    }

    // ════════════════════════════════════════════════════════════
    // MOCKS DE BASE DE DATOS
    // ════════════════════════════════════════════════════════════

    /** @test */
    public function deberia_lanzar_excepcion_cuando_getDB_no_esta_mockeado(): void
    {
        // Resetear el mock
        $GLOBALS['_mockPDO'] = null;

        $this->expectException(\PDOException::class);
        $this->expectExceptionMessage('no mockeado');

        getDB();
    }

    /** @test */
    public function deberia_devolver_mock_PDO_cuando_esta_configurado(): void
    {
        // Configurar mock de PDO
        $mockPDO = $this->createMock(PDO::class);
        $GLOBALS['_mockPDO'] = $mockPDO;

        $resultado = getDB();

        $this->assertSame($mockPDO, $resultado,
            'getDB() debe devolver el PDO mockeado'
        );

        // Limpiar
        $GLOBALS['_mockPDO'] = null;
    }

    /** @test */
    public function deberia_verificar_que_valid_estados_contiene_los_4_estados_del_sistema(): void
    {
        $this->assertCount(4, VALID_ESTADOS);
        $this->assertContains('caliente', VALID_ESTADOS);
        $this->assertContains('tibio',    VALID_ESTADOS);
        $this->assertContains('frio',     VALID_ESTADOS);
        $this->assertContains('ganado',   VALID_ESTADOS);
    }
}
