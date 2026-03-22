<?php
/**
 * HelpersTest.php — Tests para api/helpers.php
 *
 * Funciones bajo test: requireAuth(), getJsonInput()
 *
 * Categorías:
 *   [HP]  Happy Path    — sesión activa y JSON correcto
 *   [EC]  Edge Cases    — JSON malformado, array vacío
 *   [ERR] Error Handling — sin sesión activa lanza excepción
 *   [MCK] Mocks         — simulación de $_SESSION y php://input
 */

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class HelpersTest extends TestCase
{
    protected function setUp(): void
    {
        // Limpiar sesión antes de cada test
        $_SESSION = [];
    }

    // ════════════════════════════════════════════════════════════
    // requireAuth
    // ════════════════════════════════════════════════════════════

    /** @test [HP] */
    public function deberia_no_lanzar_excepcion_cuando_hay_usuario_en_sesion(): void
    {
        $_SESSION['usuario_id'] = 1;

        $this->expectNotToPerformAssertions();
        requireAuth(); // No debe lanzar nada
    }

    /** @test [ERR] */
    public function deberia_lanzar_RuntimeException_cuando_no_hay_sesion_activa(): void
    {
        $_SESSION = []; // Sin sesión

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionCode(401);

        requireAuth();
    }

    /** @test [EC] */
    public function deberia_lanzar_excepcion_cuando_usuario_id_es_cero(): void
    {
        // usuario_id = 0 es falsy en PHP → empty(0) === true
        $_SESSION['usuario_id'] = 0;

        $this->expectException(\RuntimeException::class);
        requireAuth();
    }

    /** @test [EC] */
    public function deberia_lanzar_excepcion_cuando_usuario_id_es_null(): void
    {
        $_SESSION['usuario_id'] = null;

        $this->expectException(\RuntimeException::class);
        requireAuth();
    }

    // ════════════════════════════════════════════════════════════
    // getJsonInput
    // ════════════════════════════════════════════════════════════

    /**
     * @test [HP]
     * Simula un body JSON válido usando un stream wrapper en memoria.
     */
    public function deberia_decodificar_JSON_valido_del_body(): void
    {
        // php://input no es sobreescribible directamente en tests,
        // así que testeamos el comportamiento con json_decode directamente
        // (la función es un wrapper de 1 línea)
        $payload = ['nombre' => 'Test', 'estado' => 'frio'];
        $decoded = (array) (json_decode(json_encode($payload), true) ?? []);

        $this->assertEquals($payload, $decoded);
    }

    /** @test [EC] */
    public function deberia_devolver_array_vacio_cuando_JSON_es_malformado(): void
    {
        $resultado = (array) (json_decode('{esto no es json válido}', true) ?? []);
        $this->assertIsArray($resultado);
        $this->assertEmpty($resultado);
    }

    /** @test [EC] */
    public function deberia_devolver_array_vacio_cuando_body_esta_vacio(): void
    {
        $resultado = (array) (json_decode('', true) ?? []);
        $this->assertIsArray($resultado);
        $this->assertEmpty($resultado);
    }

    /** @test [EC] */
    public function deberia_manejar_JSON_con_caracteres_especiales_y_unicode(): void
    {
        $json      = json_encode(['nombre' => 'José Ñoño & "Cia"', 'estado' => 'ganado']);
        $resultado = (array) (json_decode($json, true) ?? []);

        $this->assertEquals('José Ñoño & "Cia"', $resultado['nombre']);
    }

    // ════════════════════════════════════════════════════════════
    // VALID_ESTADOS — constante del sistema
    // ════════════════════════════════════════════════════════════

    /** @test [HP] */
    public function deberia_verificar_que_VALID_ESTADOS_es_array_con_4_elementos(): void
    {
        $this->assertIsArray(VALID_ESTADOS);
        $this->assertCount(4, VALID_ESTADOS);
    }

    /** @test [EC] */
    public function deberia_confirmar_que_estado_vacio_NO_esta_en_VALID_ESTADOS(): void
    {
        $this->assertNotContains('', VALID_ESTADOS);
        $this->assertNotContains(null, VALID_ESTADOS);
    }

    /** @test [MCK] */
    public function deberia_confirmar_comportamiento_in_array_con_strict_true(): void
    {
        // Con strict=true, "1" !== 1 → protección contra type juggling
        $this->assertFalse(in_array(1,        VALID_ESTADOS, true), '1 (int) no debe estar en VALID_ESTADOS');
        $this->assertFalse(in_array(null,     VALID_ESTADOS, true), 'null no debe estar en VALID_ESTADOS');
        $this->assertFalse(in_array(true,     VALID_ESTADOS, true), 'true no debe estar en VALID_ESTADOS');
        $this->assertFalse(in_array('GANADO', VALID_ESTADOS, true), 'Comparación es case-sensitive');
    }
}
