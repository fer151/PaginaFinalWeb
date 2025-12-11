const API_BASE = "http://localhost:3000/api";

// Manejo de secciones del menú
var botonesNav = document.querySelectorAll("nav button");
var secciones = document.querySelectorAll(".seccion");

botonesNav.forEach(function (btn) {
  btn.addEventListener("click", function () {
    var target = btn.getAttribute("data-section");

    secciones.forEach(function (sec) {
      sec.classList.remove("visible");
    });

    if (target === "registro") {
      document.getElementById("seccion-registro").classList.add("visible");
    } else if (target === "login-admin") {
      document.getElementById("seccion-login-admin").classList.add("visible");
    } else if (target === "login-cliente") {
      document.getElementById("seccion-login-cliente").classList.add("visible");
    }
  });
});

// Mostrar la sección de registro al inicio
document.getElementById("seccion-registro").classList.add("visible");

//registro de nuevo socio 
var formRegistro = document.getElementById("form-registro");
var mensajeRegistro = document.getElementById("mensaje-registro");

formRegistro.addEventListener("submit", function (e) {
  e.preventDefault();

  var formData = new FormData(formRegistro);

  var nombre = formData.get("nombre");
  var edad = Number(formData.get("edad"));
  var correo = formData.get("correo");
  var plan = formData.get("plan");
  var costoMensualTexto = formData.get("costoMensual");
  var costoMensual = costoMensualTexto ? Number(costoMensualTexto) : undefined;

  var datos = {
    nombre: nombre,
    edad: edad,
    correo: correo,
    plan: plan,
    costoMensual: costoMensual
  };

  fetch(API_BASE + "/socios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  })
    .then(function (resp) {
      return resp.json().then(function (data) {
        return { okHTTP: resp.ok, data: data };
      });
    })
    .then(function (resultado) {
      var okHTTP = resultado.okHTTP;
      var data = resultado.data;

      if (!okHTTP || !data.ok) {
        mensajeRegistro.textContent =
          "Error: " + (data.mensaje || "No se pudo registrar");
        mensajeRegistro.style.color = "black";
        return;
      }

      mensajeRegistro.textContent = "Registro correcto";
      mensajeRegistro.style.color = "black";
      formRegistro.reset();

      var panelAdmin = document.getElementById("seccion-panel-admin");
      if (panelAdmin.classList.contains("visible")) {
        cargarSocios();
      }
    })
    .catch(function (error) {
      console.error(error);
      mensajeRegistro.textContent = "Error de conexión con el servidor";
      mensajeRegistro.style.color = "black";
    });
});

//Login del admin + panel del admin 
var adminLogueado = false;

var formLoginAdmin = document.getElementById("form-login-admin");
var mensajeLoginAdmin = document.getElementById("mensaje-login-admin");
var tablaBody = document.querySelector("#tabla-socios tbody");
var inputBusquedaNombre = document.getElementById("busqueda-nombre");
var btnBuscar = document.getElementById("btn-buscar");
var btnRecargar = document.getElementById("btn-recargar");

formLoginAdmin.addEventListener("submit", function (e) {
  e.preventDefault();

  var formData = new FormData(formLoginAdmin);
  var email = formData.get("email");
  var password = formData.get("password");

  var datos = {
    email: email,
    password: password
  };

  fetch(API_BASE + "/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  })
    .then(function (resp) {
      return resp.json().then(function (data) {
        return { okHTTP: resp.ok, data: data };
      });
    })
    .then(function (resultado) {
      var okHTTP = resultado.okHTTP;
      var data = resultado.data;

      if (!okHTTP || !data.ok) {
        mensajeLoginAdmin.textContent =
          data.mensaje || "Incorrecto";
        mensajeLoginAdmin.style.color = "black";
        return;
      }

      mensajeLoginAdmin.textContent = "Bienvenido";
      mensajeLoginAdmin.style.color = "black";
      adminLogueado = true;

      //aqui es donde se muestra el panel de admin
      secciones.forEach(function (sec) {
        sec.classList.remove("visible");
      });
      document
        .getElementById("seccion-panel-admin")
        .classList.add("visible");

      cargarSocios();
    })
    .catch(function (error) {
      console.error(error);
      mensajeLoginAdmin.textContent = "Error de conexión";
      mensajeLoginAdmin.style.color = "black";
    });
});

btnBuscar.addEventListener("click", function () {
  var nombre = inputBusquedaNombre.value.trim();
  cargarSocios(nombre);
});

btnRecargar.addEventListener("click", function () {
  inputBusquedaNombre.value = "";
  cargarSocios();
});

function cargarSocios(nombreFiltro) {
  // Si no se proporciona un filtro, usar cadena vacía
  if (nombreFiltro === undefined) {
    nombreFiltro = "";
  }
// limpiar la tabla 
  tablaBody.innerHTML = "";
// Construir la URL con el parámetro de búsqueda si es necesario
  var url;
  if (nombreFiltro !== "") {
    url = API_BASE + "/socios?nombre=" + encodeURIComponent(nombreFiltro);
  } else {
    url = API_BASE + "/socios";
  }
// Realizar la solicitud fetch
  fetch(url)
    .then(function (resp) {
      return resp.json().then(function (data) {
        return { okHTTP: resp.ok, data: data };
      });
    })
    .then(function (resultado) {
      var okHTTP = resultado.okHTTP;
      var data = resultado.data;

      if (!okHTTP || !data.ok) {
        return;
      }
      // Llenar la tabla con los datos recibidos
      data.socios.forEach(function (socio) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + socio.id + "</td>" +
          "<td>" + socio.nombre + "</td>" +
          "<td>" + socio.edad + "</td>" +
          "<td>" + socio.correo + "</td>" +
          "<td>" + socio.plan + "</td>" +
          "<td>" + socio.costoMensual + "</td>" +
          '<td>' + '<button class="btn-editar" data-id="' + socio.id + '">Editar</button> ' +
          '<button class="btn-eliminar" data-id="' + socio.id + '">Eliminar</button>' + "</td>";
        tablaBody.appendChild(tr);
      });
      //eventos a los botones de editar
      var botonesEditar = document.querySelectorAll(".btn-editar");
      botonesEditar.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-id");
          editarSocio(id);
        });
      });
      //eventos a los botones de eliminar
      var botonesEliminar = document.querySelectorAll(".btn-eliminar");
      botonesEliminar.forEach(function (btn) {
        
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-id");

          eliminarSocio(id);
        });
      });
    })
    .catch(function (error) {
      console.error(error);
    });
}

function eliminarSocio(id) {
  var seguro = confirm("¿Deseas eliminar este socio?");
  if (!seguro) {
    return;
  }
// Realizar la solicitud DELETE
  fetch(API_BASE + "/socios/" + id, {
    method: "DELETE"
  })
    .then(function (resp) {
      return resp.json().then(function (data) {
        return { okHTTP: resp.ok, data: data };
      });
    })
    
    .then(function (resultado) {
      var okHTTP = resultado.okHTTP;
      var data = resultado.data;

      if (!okHTTP || !data.ok) {
        alert("Error al eliminar: " + (data.mensaje || ""));
        return;
      }
      
      alert("Socio eliminado correctamente");
      //Actualizar la tabla
      cargarSocios();
    })
    .catch(function (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
    });
}

function editarSocio(id) {
  // Buscar la fila en la tabla
  var filas = tablaBody.querySelectorAll("tr");
  var filaEncontrada = null;
  
  filas.forEach(function (fila) {
    var primeraCelda = fila.firstElementChild;
    if (primeraCelda && primeraCelda.textContent == id) {
      filaEncontrada = fila;
    }
  });

  if (!filaEncontrada) {
    return;
  }
  // Obtener los datos actuales
  var celdas = filaEncontrada.querySelectorAll("td");

  var nombreActual = celdas[1].textContent;
  var edadActual = celdas[2].textContent;
  var correoActual = celdas[3].textContent;
  var planActual = celdas[4].textContent;
  var costoActual = celdas[5].textContent;
  // Cambiar los datos
  var nuevoNombre = prompt("Nuevo nombre:", nombreActual);
  if (nuevoNombre === null) nuevoNombre = nombreActual;
  //pedir los demas datos
  var nuevaEdad = prompt("Nueva edad:", edadActual);
  if (nuevaEdad === null) nuevaEdad = edadActual;
  //nuevo correo
  var nuevoCorreo = prompt("Nuevo correo:", correoActual);
  if (nuevoCorreo === null) nuevoCorreo = correoActual;
  //nuevo plan
  var nuevoPlan = prompt("Nuevo plan:", planActual);
  if (nuevoPlan === null) nuevoPlan = planActual;
  //nuevo costo mensual
  var nuevoCosto = prompt("Nuevo costo mensual:", costoActual);
  if (nuevoCosto === null) nuevoCosto = costoActual;
  // Datos editados
  var datosEditados = {
    nombre: nuevoNombre,
    edad: Number(nuevaEdad),
    correo: nuevoCorreo,
    plan: nuevoPlan,
    costoMensual: Number(nuevoCosto)
  };
  // solicitud PUT para actualizar
  fetch(API_BASE + "/socios/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosEditados)
  })
    .then(function (resp) {
      return resp.json().then(function (data) {
        return { okHTTP: resp.ok, data: data };
      });
    })
    .then(function (resultado) {
      var okHTTP = resultado.okHTTP;
      var data = resultado.data;
      //
      if (!okHTTP || !data.ok) {
        alert("Error al editar: " + (data.mensaje || ""));
        return;
      }

      alert("Socio actualizado correctamente");
      cargarSocios();
    })
    .catch(function (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
    });
}

//LOGIN CLIENTE + PANEL CLIENTE

var formLoginCliente = document.getElementById("form-login-cliente");
var mensajeLoginCliente = document.getElementById("mensaje-login-cliente");
var seccionPanelCliente = document.getElementById("seccion-panel-cliente");
var datosClienteDiv = document.getElementById("datos-cliente");

formLoginCliente.addEventListener("submit", function (e) {
  e.preventDefault();

  var formData = new FormData(formLoginCliente);
  var correo = formData.get("correo");

  fetch(API_BASE + "/cliente/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo: correo })
  })
    .then(function (resp) {
      return resp.json().then(function (data) {
        return { okHTTP: resp.ok, data: data };
      });
    })
    .then(function (resultado) {
      var okHTTP = resultado.okHTTP;
      var data = resultado.data;

      if (!okHTTP || !data.ok) {
        mensajeLoginCliente.textContent =
          data.mensaje || "No se pudo iniciar sesión";
        mensajeLoginCliente.style.color = "red";
        return;
      }

      mensajeLoginCliente.textContent = "Inicio de sesión correcto";
      mensajeLoginCliente.style.color = "green";

      var s = data.socio;

      datosClienteDiv.innerHTML =
        "<p><strong>Nombre:</strong> " +
        s.nombre +
        "</p>" +
        "<p><strong>Edad:</strong> " +
        s.edad +
        "</p>" +
        "<p><strong>Correo:</strong> " +
        s.correo +
        "</p>" +
        "<p><strong>Plan:</strong> " +
        s.plan +
        "</p>" +
        "<p><strong>Costo mensual:</strong> $" +
        s.costoMensual +
        "</p>";

      secciones.forEach(function (sec) {
        sec.classList.remove("visible");
      });
      seccionPanelCliente.classList.add("visible");
    })
    .catch(function (error) {
      console.error(error);
      mensajeLoginCliente.textContent =
        "Error de conexión con el servidor";
      mensajeLoginCliente.style.color = "red";
    });
});
