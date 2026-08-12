import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

function base(props: P) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }
}

export const IconCart = (props: P) => (
  <svg {...base(props)}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="17" cy="20" r="1.4" />
    <path d="M3 3h2l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.2L20 7H6" />
  </svg>
)

export const IconSearch = (props: P) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

export const IconClose = (props: P) => (
  <svg {...base(props)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export const IconMenu = (props: P) => (
  <svg {...base(props)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

export const IconChevronDown = (props: P) => (
  <svg {...base(props)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const IconChevronUp = (props: P) => (
  <svg {...base(props)}>
    <path d="m6 15 6-6 6 6" />
  </svg>
)

export const IconChevronLeft = (props: P) => (
  <svg {...base(props)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const IconChevronRight = (props: P) => (
  <svg {...base(props)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const IconPlus = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconMinus = (props: P) => (
  <svg {...base(props)}>
    <path d="M5 12h14" />
  </svg>
)

export const IconTrash = (props: P) => (
  <svg {...base(props)}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
)

export const IconWhatsApp = (props: P) => (
  <svg {...base(props)}>
    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 20l1-5.2a8.4 8.4 0 1 1 17-3.3Z" />
    <path d="M8.5 9.5c0 3 3.5 6 6 6 1.5 0 2.5-1 2.5-1l-1.8-1.4-1.2.8c-.9-.6-2-1.7-2.6-2.6l.8-1.2L11 8.5S9.7 9.2 8.5 9.5Z" />
  </svg>
)

export const IconImage = (props: P) => (
  <svg {...base(props)}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
)

export const IconArrowRight = (props: P) => (
  <svg {...base(props)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const IconUpload = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
)

export const IconCheck = (props: P) => (
  <svg {...base(props)}>
    <path d="m5 13 4 4L19 7" />
  </svg>
)

export const IconEdit = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

export const IconLogOut = (props: P) => (
  <svg {...base(props)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </svg>
)

export const IconTag = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 2 2 7l10 5 10-5-10-5Z" />
    <path d="m2 17 10 5 10-5" />
  </svg>
)