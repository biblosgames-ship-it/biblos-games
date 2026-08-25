export interface LegalDocument {
  id: "PRIVACY" | "TERMS" | "PURCHASES" | "COMMUNITY" | "DELETE_ACCOUNT" | "MINORS_POLICY";
  title: string;
  subtitle: string;
  icon: string;
  lastUpdated: string;
  content: {
    sectionTitle: string;
    body: string[];
  }[];
}

export const LEGAL_POLICIES: Record<string, LegalDocument> = {
  PRIVACY: {
    id: "PRIVACY",
    title: "Politica de Privacidad y Manejo de Datos",
    subtitle: "Principio de Minimizacion: Solo recopilamos lo estrictamente necesario",
    icon: "🛡️",
    lastUpdated: "22 de Agosto de 2026",
    content: [
      {
        sectionTitle: "1. Principio Fundamental de Privacidad",
        body: [
          "En Biblos Games respetamos profundamente tu privacidad y la santidad de tu experiencia de aprendizaje espiritual.",
          "Operamos bajo el principio de Minimizacion de Datos (Privacy by Design): NO recopilamos informacion personal por el simple hecho de recopilarla. La gran mayoria de tus datos de juego se procesan de forma local en tu dispositivo."
        ]
      },
      {
        sectionTitle: "2. Datos Especificos que Recopilamos y su Finalidad",
        body: [
          "• Nombre o Alias Publico: Para identificarte en partidas multijugador, la Copa Biblos y el Salon de la Fama.",
          "• Correo Electronico (Opcional en registro): Exclusivamente para autenticacion segura, recuperacion de cuenta y vinculacion de compras.",
          "• Pais y Bandera: Para ubicarte en el ranking regional/nacional en el Salon de la Fama y agrupar torneos comunitarios.",
          "• Estadisticas de Juego (Partidas, Aciertos, ELO y Rachas): Para calcular tu nivel, alimentar tu motor de entrenamiento (Biblos Coach) y otorgarte Talentos.",
          "• Identificador Anonimo del Dispositivo: Una clave alfanumerica unica para mantener tu sesion activa y sincronizar el estado de tu suscripcion.",
          "• Direccion IP y Datos Tecnicos Basicos: Utilizados temporalmente por los servidores Socket.io durante partidas en linea para conectar jugadores con baja latencia y prevenir trampas.",
          "• Registro de Compras: Verificacion de transacciones (Plan Premium / Talentos) a traves de las pasarelas oficiales (Google Play, Apple App Store o Stripe). Nunca almacenamos numeros de tarjetas de credito."
        ]
      },
      {
        sectionTitle: "3. Lo que NUNCA Recopilamos",
        body: [
          "• No accedemos a tu lista de contactos ni libreta telefonica.",
          "• No rastreamos tu ubicacion GPS en tiempo real ni en segundo plano.",
          "• No vendemos, alquilamos ni compartimos tus datos con intermediarios publicitarios ni terceros para marketing dirigido."
        ]
      }
    ]
  },
  TERMS: {
    id: "TERMS",
    title: "Terminos y Condiciones de Uso",
    subtitle: "Reglas de convivencia y uso licito de la plataforma",
    icon: "📜",
    lastUpdated: "22 de Agosto de 2026",
    content: [
      {
        sectionTitle: "1. Aceptacion del Servicio",
        body: [
          "Al descargar, acceder o jugar en Biblos Games, aceptas estos Terminos y Condiciones. Si no estas de acuerdo con alguna clausula, debes abstenerte de utilizar la plataforma."
        ]
      },
      {
        sectionTitle: "2. Proposito de la Plataforma",
        body: [
          "Biblos Games es una plataforma ludica y educativa creada para fomentar el estudio de la Biblia, la fraternidad familiar y la competencia sana y positiva.",
          "Queda estrictamente prohibido el uso de software de automatizacion (bots), alteracion de codigo, inyeccion de trampas o cualquier intento de vulnerar el calculo de rating ELO."
        ]
      },
      {
        sectionTitle: "3. Propiedad Intelectual",
        body: [
          "Biblos Games, su logotipo, mecanicas de tablero, ilustraciones de avatares y diseno son propiedad exclusiva de Biblos Papeleria y Libreria Cristiana SRL. Las citas biblicas pertenecen a sus respectivos titulares de derechos bajo las normas de uso de citas de Sociedades Biblicas Unidas."
        ]
      }
    ]
  },
  PURCHASES: {
    id: "PURCHASES",
    title: "Politica de Compras y Bienes Virtuales",
    subtitle: "Talentos Biblicos, Suscripciones y Reembolsos",
    icon: "🪙",
    lastUpdated: "22 de Agosto de 2026",
    content: [
      {
        sectionTitle: "1. Talentos Biblicos y Bienes Virtuales",
        body: [
          "Los Talentos son una moneda virtual interna de juego destinada exclusivamente a desbloquear partidas, modos de estudio y participar en la Copa Biblos.",
          "Los Talentos no constituyen dinero real, no tienen valor monetario fuera de la app, y no pueden ser canjeados, transferidos ni revendidos por dinero fiduciario."
        ]
      },
      {
        sectionTitle: "2. Membresia y Plan Premium VIP",
        body: [
          "El Plan Premium desbloquea el 100% del banco de preguntas (+1,000 preguntas), todas las 9 tematicas biblicas y acceso ilimitado a salas.",
          "Las compras se procesan de forma cifrada mediante las tiendas oficiales (Google Play Store, App Store). Las solicitudes de reembolso se rigen por las politicas estandar de la tienda correspondiente."
        ]
      }
    ]
  },
  COMMUNITY: {
    id: "COMMUNITY",
    title: "Codigo de Conducta y Politica de Comunidad",
    subtitle: "Ambiente fraterno, respetuoso y libre de toxicidad",
    icon: "🕊️",
    lastUpdated: "22 de Agosto de 2026",
    content: [
      {
        sectionTitle: "1. Respeto Fraterno y Tolerancia Cero",
        body: [
          "Biblos Games es un espacio sagrado y familiar. No toleramos:",
          "• Nombres de perfil, avatares o mensajes ofensivos, vulgares o que inciten al odio.",
          "• Acoso, intimidacion o conducta antideportiva hacia otros hermanos o jugadores.",
          "• Abandono intencional y reiterado de partidas para perjudicar a los rivales."
        ]
      },
      {
        sectionTitle: "2. Herramientas de Moderacion y Sanciones",
        body: [
          "Todos los jugadores disponen de botones para Aceptar/Rechazar, Bloquear y Reportar usuarios con 1 clic.",
          "Nuestro equipo revisa los reportes. Los jugadores que violen estas normas recibiran penalizaciones de ELO, suspension temporal de Matchmaking o baneo permanente de cuenta."
        ]
      }
    ]
  },
  MINORS_POLICY: {
    id: "MINORS_POLICY",
    title: "Proteccion de Menores (COPPA / GDPR-K)",
    subtitle: "Garantia de seguridad para ninos, familias y escuelas dominicales",
    icon: "👶",
    lastUpdated: "22 de Agosto de 2026",
    content: [
      {
        sectionTitle: "1. Cumplimiento Estricto para Menores",
        body: [
          "Biblos Games esta disenado como un juego familiar y educativo apto para todas las edades. Cumplimos con la Ley de Proteccion de la Privacidad Infantil en Linea (COPPA) y el GDPR para menores.",
          "No recopilamos informacion de contacto de menores de 13 anos sin el consentimiento de sus padres o tutores."
        ]
      },
      {
        sectionTitle: "2. Entorno Libre de Chat de Texto Abierto y Microfono",
        body: [
          "Para proteger a los ninos de cualquier interaccion peligrosa, Biblos Games NO incluye chat de texto libre ni canales de voz no moderados entre desconocidos. Toda la comunicacion se realiza mediante frases biblicas positivas predeterminadas y emojis de bendicion."
        ]
      }
    ]
  },
  DELETE_ACCOUNT: {
    id: "DELETE_ACCOUNT",
    title: "Eliminacion de Cuenta y Olvido Digital",
    subtitle: "Derecho ARCO: Borrado total de tus datos personales",
    icon: "🗑️",
    lastUpdated: "22 de Agosto de 2026",
    content: [
      {
        sectionTitle: "1. Tu Derecho a la Eliminacion Total",
        body: [
          "En cumplimiento con el derecho al olvido digital (GDPR / CCPA / Regulaciones de App Store y Google Play), puedes eliminar tu cuenta y todos tus datos asociados en cualquier momento con un solo toque."
        ]
      },
      {
        sectionTitle: "2. Proceso de Borrado Inmediato",
        body: [
          "Al presionar Eliminar Mi Cuenta dentro del menu de Perfil:",
          "• Se borraran permanentemente tu historial de partidas, estadisticas, ranking ELO y saldo de talentos.",
          "• Se desvinculara tu perfil de la tabla de clasificacion y salas.",
          "• Se limpiara el almacenamiento local y remoto asociado a tu identificador de usuario."
        ]
      }
    ]
  }
};
