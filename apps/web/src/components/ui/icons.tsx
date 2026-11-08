import type { SVGProps } from 'react'

/** Base SVG decorativa; el control que la contiene aporta su propio nombre accesible. */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  )
}

/** Icono decorativo de correo electrónico. */
export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </Icon>
  )
}

/** Icono decorativo de acceso protegido. */
export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="10" width="15" height="11" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14.5v2.5" strokeWidth={2.2} />
    </Icon>
  )
}

/** Icono decorativo de perfil individual. */
export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0Z" />
    </Icon>
  )
}

/** Icono decorativo de mostrar contraseña. */
export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  )
}

/** Icono decorativo de ocultar contraseña. */
export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="m4 4 16 16" />
    </Icon>
  )
}

/** Icono decorativo de envío. */
export function SendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M21.5 2.5 10.5 13.5" />
      <path d="M21.5 2.5 14.5 21.5l-4-8-8-4Z" />
    </Icon>
  )
}

/** Marca decorativa de confirmación. */
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Icon>
  )
}

/** Flecha decorativa para volver. */
export function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20 12H4.5" />
      <path d="m10.5 6-6 6 6 6" />
    </Icon>
  )
}

/** Flecha decorativa para avanzar. */
export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 12h15.5" />
      <path d="m13.5 6 6 6-6 6" />
    </Icon>
  )
}

/** Marca circular decorativa de requisito cumplido. */
export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props} stroke="none">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path
        d="m7 12.5 3.2 3.2L17 9"
        fill="none"
        stroke="#fff"
        strokeWidth={2.4}
      />
    </Icon>
  )
}

/** Círculo decorativo de requisito pendiente. */
export function CircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
    </Icon>
  )
}

/** Icono decorativo de hogar o espacio. */
export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </Icon>
  )
}

/** Icono decorativo de balance o reparto. */
export function ScaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3.5V20" />
      <path d="M7.5 20h9" />
      <path d="M4.5 7h15" />
      <path d="M12 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      <path d="m4.5 7-3 6.5h6L4.5 7Z" />
      <path d="m19.5 7-3 6.5h6l-3-6.5Z" />
    </Icon>
  )
}

/** Icono decorativo de indicadores financieros. */
export function BarsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="13" width="4" height="7.5" rx="1" />
      <rect x="10" y="8.5" width="4" height="12" rx="1" />
      <rect x="16.5" y="3.5" width="4" height="17" rx="1" />
    </Icon>
  )
}

/** Icono decorativo de información contextual. */
export function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" focusable="false" {...props}>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" />
      <path d="M12 11v6" stroke="#fff" />
      <circle cx="12" cy="7.5" r="1.2" fill="#fff" stroke="none" />
    </svg>
  )
}

/** Icono decorativo de tarjeta o pago. */
export function CardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7 14.5h4" />
    </Icon>
  )
}

/** Icono decorativo de renovación. */
export function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M19.5 9A8 8 0 0 0 5 7.5L3.5 9" />
      <path d="M3.5 4.5V9H8" />
      <path d="M4.5 15A8 8 0 0 0 19 16.5l1.5-1.5" />
      <path d="M20.5 19.5V15H16" />
    </Icon>
  )
}

/** Icono decorativo de miembros o pareja. */
export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4" />
      <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </Icon>
  )
}

/** Indicador decorativo de navegación anterior. */
export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m15 5-7 7 7 7" />
    </Icon>
  )
}

/** Indicador decorativo de navegación siguiente. */
export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m9 5 7 7-7 7" />
    </Icon>
  )
}

/** Icono decorativo de fecha o mes. */
export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17" />
      <path d="M8 3v4M16 3v4" />
      <path d="M8 14h2M14 14h2M8 17h2" />
    </Icon>
  )
}

/** Icono decorativo de creación. */
export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

/** Flecha decorativa de subida. */
export function ArrowUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Icon>
  )
}

/** Flecha decorativa de bajada. */
export function ArrowDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Icon>
  )
}

/** Icono decorativo de compra. */
export function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2.5 4h2.5l2.2 10.5h11l2-7.5H6.2" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </Icon>
  )
}

/** Icono decorativo de alimentación. */
export function UtensilsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 3v7a2.5 2.5 0 0 0 5 0V3M8.5 3v18" />
      <path d="M17.5 21V3c-2 1.5-3 4-3 7v4h3" />
    </Icon>
  )
}

/** Icono decorativo de transporte. */
export function CarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 16v-4l2-5.5h12L20 12v4" />
      <rect x="3" y="12" width="18" height="5" rx="1.5" />
      <path d="M5.5 17v2.5M18.5 17v2.5" />
      <circle cx="7.5" cy="14.5" r=".5" />
      <circle cx="16.5" cy="14.5" r=".5" />
    </Icon>
  )
}

/** Icono decorativo de conectividad o suministros. */
export function WifiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M2.5 9a14 14 0 0 1 19 0" />
      <path d="M5.5 12.5a9.5 9.5 0 0 1 13 0" />
      <path d="M8.7 16a5 5 0 0 1 6.6 0" />
      <circle cx="12" cy="19.5" r=".8" />
    </Icon>
  )
}

/** Icono decorativo de actividad física. */
export function DumbbellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 12h10" />
      <rect x="4" y="7.5" width="3" height="9" rx="1" />
      <rect x="17" y="7.5" width="3" height="9" rx="1" />
      <path d="M2 10.5v3M22 10.5v3" />
    </Icon>
  )
}

/** Icono decorativo de concepto o categoría. */
export function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z" />
      <circle cx="8" cy="8" r="1.3" />
    </Icon>
  )
}

/** Icono decorativo de edición. */
export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 20l1-4.5L16 4.5a2.1 2.1 0 0 1 3 3L8 18.5z" />
      <path d="M14 6.5l3 3" />
    </Icon>
  )
}

/** Icono decorativo de eliminación. */
export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h16M9.5 6.5V4h5v2.5" />
      <path d="M6 6.5l1 13.5h10l1-13.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </Icon>
  )
}
/** Icono decorativo de ingresos o cartera. */
export function WalletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
      <path d="M3 6.5A2.5 2.5 0 0 0 5.5 9h13A1.5 1.5 0 0 1 20 10.5V15h-4a2 2 0 0 1 0-4h4" />
    </Icon>
  )
}

/** Icono decorativo de ingresos laborales. */
export function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18" />
    </Icon>
  )
}

/** Icono decorativo de pago entre miembros. */
export function SwapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 8h15l-3.5-3.5M20 16H5l3.5 3.5" />
    </Icon>
  )
}

/** Icono decorativo de historial. */
export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" />
      <path d="M3.5 4v4.5H8M12 8v4.5l3 2" />
    </Icon>
  )
}

/** Icono decorativo de documento o movimiento. */
export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z" />
      <path d="M14 3.5V8h4.5M9 12.5h6M9 16h6" />
    </Icon>
  )
}

/** Icono decorativo de cierre de sesión. */
export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h4" />
      <path d="M10.5 12h10M16.5 8l4 4-4 4" />
    </Icon>
  )
}