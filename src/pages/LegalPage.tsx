import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Shield, Cookie, CreditCard } from 'lucide-react'

const LEGAL_PAGES: Record<string, {
  title: string
  icon: typeof FileText
  updated: string
  content: string
}> = {
  'terminos-y-condiciones': {
    title: 'Terminos y Condiciones',
    icon: FileText,
    updated: '1 de septiembre de 2026',
    content: `## 1. Aceptacion de los terminos

Al acceder y utilizar Routravel, aceptas los presentes Terminos y Condiciones de uso. Si no estas de acuerdo con alguno de ellos, te rogamos que no utilices la plataforma.

## 2. Descripcion del servicio

Routravel es una plataforma digital que conecta a creadores de rutas turisticas (routravelers) con viajeros. Los creadores publican rutas guiadas con archivos descargables (GPX, PDF, mapas) y los viajeros pueden comprarlas mediante pago unico a traves de Stripe.

## 3. Registro de usuario

Para comprar rutas, debes crear una cuenta con un email valido y una contrasena. Eres responsable de mantener la confidencialidad de tus credenciales. Routravel no se hace responsable del uso no autorizado de tu cuenta.

## 4. Compra de rutas

Las rutas se compran mediante pago unico a traves de Stripe. Una vez confirmado el pago, tienes acceso permanente a los archivos de la ruta (GPX, PDF y mapa). No se realizan cargos recurrentes.

## 5. Politica de reembolsos

Dado que las rutas son productos digitales descargables, **no se admiten devoluciones** una vez se ha confirmado el pago y se ha accedido a los archivos. Si experimentas un problema tecnico que impide la descarga, contactanos para resolverlo.

## 6. Propiedad intelectual

Las rutas publicadas en Routravel son propiedad de sus creadores. Los archivos descargables (GPX, PDF, mapas) son para uso personal del comprador. Queda prohibida la redistribucion, venta o publicacion de los contenidos sin autorizacion del creador.

## 7. Responsabilidad del creador

Los creadores de rutas son responsables de la precision de la informacion, la seguridad de las rutas y la actualizacion de los archivos. Routravel actua como intermediario y no se hace responsable del contenido de las rutas.

## 8. Comisiones

Routravel retiene una comision del 20% sobre cada venta. El 80% restante corresponde al creador de la ruta. Estas cantidades se calculan automaticamente en cada compra.

## 9. Modificaciones

Routravel se reserva el derecho de modificar estos terminos en cualquier momento. Las modificaciones seran efectivas desde su publicacion en esta pagina.

## 10. Ley aplicable

Estos terminos se rigen por la legislacion espanola. Cualquier disputa se resolvera ante los tribunales competentes de Espana.`
  },
  'politica-de-privacidad': {
    title: 'Politica de Privacidad',
    icon: Shield,
    updated: '1 de septiembre de 2026',
    content: `## 1. Responsable del tratamiento

Routravel es responsable del tratamiento de tus datos personales. Puedes contactarnos en cualquier momento para ejercer tus derechos.

## 2. Datos que recopilamos

- **Datos de cuenta:** email, nombre, apellidos, fecha de nacimiento y foto de perfil.
- **Datos de compra:** historial de rutas compradas, email de pago y estado de la transaccion.
- **Datos de navegacion:** cookies y tecnologias similares (ver Politica de Cookies).
- **Datos de creador:** rutas publicadas, ganancias y comisiones.

## 3. Finalidad del tratamiento

- Gestionar tu cuenta de usuario y autenticacion.
- Procesar pagos a traves de Stripe (que trata tus datos segun su propia politica).
- Enviarte notificaciones sobre compras y ventas.
- Verificar la identidad de los creadores de rutas (routravelers).
- Cumplir con obligaciones legales y fiscales.

## 4. Base legal

- **Ejecucion de contrato:** para gestionar tu cuenta y procesar compras.
- **Consentimiento:** para enviar notificaciones y usar cookies no esenciales.
- **Interes legitimo:** para garantizar la seguridad de la plataforma.

## 5. Conservacion de datos

Tus datos se conservaran mientras mantengas una cuenta activa. Los datos de transacciones se conservaran durante el periodo legal obligatorio (hasta 6 anos).

## 6. Derechos del usuario

Puedes ejercer en cualquier momento tus derechos de:
- Acceso a tus datos personales.
- Rectificacion de datos inexactos.
- Supresion de tus datos ("derecho al olvido").
- Limitacion del tratamiento.
- Portabilidad de datos.
- Oposicion al tratamiento.

Para ejercer estos derechos, contacta con nosotros.

## 7. Destinatarios

Tus datos pueden ser tratados por:
- **Stripe:** procesador de pagos.
- **Supabase:** proveedor de infraestructura de base de datos.
- **Proveedores de email:** para el envio de notificaciones.

Ninguno de estos proveedores utilizara tus datos para fines propios.

## 8. Seguridad

Implementamos medidas tecnicas y organizativas para proteger tus datos, incluyendo cifrado, control de acceso y verificacion de firmas en transacciones. La plataforma cuenta con verificacion CAPTCHA para prevenir accesos automatizados.

## 9. Transferencias internacionales

Algunos de nuestros proveedores pueden tratar datos en paises fuera de la UE. En dichos casos, se aplican las garantias adecuadas segun el RGPD.`
  },
  'politica-de-cookies': {
    title: 'Politica de Cookies',
    icon: Cookie,
    updated: '1 de septiembre de 2026',
    content: `## 1. Que son las cookies?

Las cookies son pequenos archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten recordar tu sesion, preferencias y estadisticas de uso.

## 2. Cookies que utilizamos

### Cookies tecnicas (necesarias)
- **Sesion de autenticacion:** necesaria para mantener tu sesion iniciada.
- **Token CSRF:** protege formularios contra ataques de falsificacion de peticion.

### Cookies analiticas (opcionales)
- Estadisticas de visita y comportamiento de navegacion.

### Cookies de terceros
- **Stripe:** cookies relacionadas con el procesamiento de pagos.
- **Google Maps:** si visualizas mapas integrados en las rutas.

## 3. Gestion de cookies

Puedes configurar tu navegador para aceptar, bloquear o eliminar cookies. Ten en cuenta que bloquear cookies tecnicas puede impedir el uso de la plataforma (inicio de sesion, compras).

## 4. Conservacion

Las cookies de sesion se eliminan al cerrar el navegador. Las cookies persistentes tienen una duracion maxima de 12 meses.

## 5. Actualizacion

Esta politica puede actualizarse en cualquier momento. Los cambios seran efectivos desde su publicacion.`
  },
  'condiciones-de-compra': {
    title: 'Condiciones de Compra',
    icon: CreditCard,
    updated: '1 de septiembre de 2026',
    content: `## 1. Proceso de compra

1. Selecciona la ruta que deseas adquirir.
2. Inicia sesion o compra como invitado proporcionando tu email.
3. Seras redirigido a la pasarela de pago de Stripe.
4. Una vez confirmado el pago, tendras acceso inmediato a los archivos descargables (GPX, PDF y mapa).

## 2. Metodos de pago

Aceptamos pagos con tarjeta de credito y debito a traves de Stripe. Stripe procesa el pago de forma segura y Routravel no almacena los datos de tu tarjeta.

## 3. Confirmacion de compra

Recibiras una notificacion por email y en la plataforma cuando el pago se confirme. Si no recibes la confirmacion en unos minutos, contactanos.

## 4. Acceso a los archivos

El acceso a los archivos descargables es permanente. Puedes descargarlos las veces que necesites desde tu cuenta en "Mis rutas" o desde la pagina de la ruta.

## 5. Productos digitales

Las rutas son productos digitales. Por su naturaleza, **no admiten devolucion ni cambio** una vez se ha confirmado el pago y se ha accedido a los archivos.

## 6. Soporte

Si tienes problemas tecnicos con la descarga o apertura de archivos, contactanos. Te ayudaremos a resolver cualquier incidencia.

## 7. Precios

Los precios de las rutas los establece cada creador. Routravel anade una comision del 20% sobre el precio. El precio mostrado en la plataforma es el precio final que pagas.

## 8. Divisa

Todos los precios se muestran en euros (EUR). Si tu tarjeta usa otra divisa, el banco puede aplicar comisiones de cambio.

## 9. Proteccion de datos

Tus datos de pago son tratados exclusivamente por Stripe. Routravel solo recibe confirmacion del pago y no tiene acceso a los datos de tu tarjeta.`
  },
}

export function LegalPage() {
  const { slug } = useParams()
  const page = slug ? LEGAL_PAGES[slug] : null

  if (!page) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-sand-50">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <FileText className="w-12 h-12 text-sand-300 mx-auto mb-4" />
          <h1 className="font-serif text-2xl text-sand-900 mb-2">Pagina no encontrada</h1>
          <p className="text-sand-600 mb-4">El documento legal que buscas no existe.</p>
          <Link to="/" className="btn-primary">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  const Icon = page.icon

  return (
    <div className="min-h-screen pt-28 pb-20 bg-sand-50">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sand-600 hover:text-sand-900 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-forest-50 flex items-center justify-center">
            <Icon className="w-6 h-6 text-forest-600" />
          </div>
          <div>
            <h1 className="font-serif text-3xl text-sand-900">{page.title}</h1>
            <p className="text-sm text-sand-500">Ultima actualizacion: {page.updated}</p>
          </div>
        </div>

        <div className="card p-8 mt-6">
          <div className="prose prose-sand max-w-none">
            {page.content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return <h2 key={i} className="font-serif text-xl text-sand-900 mt-6 mb-3">{line.replace('## ', '')}</h2>
              }
              if (line.startsWith('- ')) {
                return <p key={i} className="text-sand-700 text-sm leading-relaxed pl-4">{line.replace('- ', '• ')}</p>
              }
              if (line.trim() === '') {
                return <div key={i} className="h-3" />
              }
              if (/^\d+\.\s/.test(line)) {
                return <p key={i} className="text-sand-700 leading-relaxed">{line}</p>
              }
              return <p key={i} className="text-sand-700 leading-relaxed">{line}</p>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
