const express = require("express");
const router = express.Router();
const pool = require("../db");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gym.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

// Login administrador
router.post("/admin/login", async (req, res) => {
  const datos = req.body || {};
  const email = (datos.email || "").trim();
  const password = (datos.password || "").trim();

  console.log("Intento de login admin:", email);

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      mensaje: "Faltan email o password"
    });
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({
      ok: true,
      rol: "administrador",
      mensaje: "Acceso correcto"
    });
  } else {
    return res.status(401).json({
      ok: false,
      mensaje: "Datos incorrectos"
    });
  }
});

// Login cliente
router.post("/cliente/login", async (req, res) => {
  const datos = req.body || {};
  const correo = datos.correo;

  if (!correo) {
    return res.status(400).json({
      ok: false,
      mensaje: "Falta el correo"
    });
  }

  try {
    const [filas] = await pool.query(
      "SELECT * FROM socios WHERE correo = ?",
      [correo]
    );

    if (filas.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "No se encontró un socio con ese correo"
      });
    }

    const fila = filas[0];

    const socio = {
      id: fila.id,
      nombre: fila.nombre,
      edad: fila.edad,
      correo: fila.correo,
      plan: fila.plan,
      costoMensual: fila.costo_mensual
    };

    res.json({
      ok: true,
      rol: "cliente",
      socio: socio
    });
  } catch (error) {
    console.error("Error al buscar socio para login cliente:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al buscar al socio en la base de datos"
    });
  }
});

// Obtener socios 
router.get("/socios", async (req, res) => {
  const nombre = req.query.nombre;

  try {
    let sql = "SELECT * FROM socios";
    let valores = [];

    if (nombre) {
      sql = "SELECT * FROM socios WHERE nombre LIKE ?";
      valores = ["%" + nombre + "%"];
    }
    //consulta 
    const [resultado] = await pool.query(sql, valores);
    // Mapear resultados
    const lista = resultado.map((fila) => {
      return {
        id: fila.id,
        nombre: fila.nombre,
        edad: fila.edad,
        correo: fila.correo,
        plan: fila.plan,
        costoMensual: fila.costo_mensual
      };
    });

    res.json({
      ok: true,
      socios: lista
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener los socios"
    });
  }
});

// Registrar socio 
router.post("/socios", async (req, res) => {
  // obtener datos 
  const datos = req.body || {};
  const nombre = datos.nombre;
  const edad = datos.edad;
  const correo = datos.correo;
  const plan = datos.plan;
  const costoMensual = datos.costoMensual;

  console.log("Datos recibidos para registrar:", datos);

  if (!nombre || !edad || !correo) {
    return res.status(400).json({
      ok: false,
      mensaje: "Nombre, edad y correo son obligatorios"
    });
  }
// Insertar en la base de datos
  try {
    const [resultado] = await pool.query(
      "INSERT INTO socios (nombre, edad, correo, plan, costo_mensual) VALUES (?, ?, ?, ?, ?)",
      [ nombre, edad, correo, plan || "Mensual básica", costoMensual || 500]
    );

    console.log("Insert realizado, id:", resultado.insertId);
// Obtener el socio recién insertado
    const [filas] = await pool.query(
      "SELECT * FROM socios WHERE id = ?",
      [resultado.insertId]
    );

    const fila = filas[0];
// Construir objeto 
    const socio = {
      id: fila.id,
      nombre: fila.nombre,
      edad: fila.edad,
      correo: fila.correo,
      plan: fila.plan,
      costoMensual: fila.costo_mensual
    };

    res.status(201).json({
      ok: true,
      mensaje: "Socio registrado correctamente",
      socio: socio
    });
  } catch (error) {
    console.error("Error al insertar socio:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        ok: false,
        mensaje: "ya existe un socio con ese correo"
      });
    }
  }
});

// Editar socio
router.put("/socios/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const datos = req.body || {};
  const nombreNuevo = datos.nombre;
  const edadNueva = datos.edad;
  const correoNuevo = datos.correo;
  const planNuevo = datos.plan;
  const costoNuevo = datos.costoMensual;
  // validar si el socio existe
  try {
    const [filas] = await pool.query(
      "SELECT * FROM socios WHERE id = ?",
      [id]
    );

    if (filas.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Socio no encontrado"
      });
    }
    // Obtener datos actuales
    const socioActual = filas[0];

    let nombreFinal = socioActual.nombre;
    let edadFinal = socioActual.edad;
    let correoFinal = socioActual.correo;
    let planFinal = socioActual.plan;
    let costoFinal = socioActual.costo_mensual;
    // campos a actualizar
    if (nombreNuevo) nombreFinal = nombreNuevo;
    if (edadNueva) edadFinal = edadNueva;
    if (correoNuevo) correoFinal = correoNuevo;
    if (planNuevo) planFinal = planNuevo;
    if (costoNuevo) costoFinal = costoNuevo;
    // base de datos actualizada 
    await pool.query(
      "UPDATE socios SET nombre = ?, edad = ?, correo = ?, plan = ?, costo_mensual = ? WHERE id = ?",
      [nombreFinal, edadFinal, correoFinal, planFinal, costoFinal, id]
    );  
    // respuesta del servidor
    res.json({
      ok: true,
      mensaje: "Socio actualizado correctamente",
      socio: {
        id: id,
        nombre: nombreFinal,
        edad: edadFinal,
        correo: correoFinal,
        plan: planFinal,
        costoMensual: costoFinal
      }
    });
  } catch (error) {
    console.error("Error al actualizar socio:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar socio en la base de datos"
    });
  }
});

// Eliminar socio (DELETE)
router.delete("/socios/:id", async (req, res) => {
  const id = parseInt(req.params.id);
// Verificar si el socio existe
  try {
    const [filas] = await pool.query(
      "SELECT * FROM socios WHERE id = ?",
      [id]
    );

    if (filas.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Socio no encontrado"
      });
    }
    // Eliminar socio
    await pool.query("DELETE FROM socios WHERE id = ?", [id]);

    res.json({
      ok: true,
      mensaje: "Socio eliminado correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar socio:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar socio en la base de datos"
    });
  }
});

module.exports = router;
