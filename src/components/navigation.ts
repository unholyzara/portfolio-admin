export interface NavChild {
  label: string;
  to: string;
}

export interface NavItem {
  label: string;
  to?: string;
  children?: NavChild[];
}

export const NAV: NavItem[] = [
  {
    label: 'Persona',
    children: [
      { label: 'Informazioni Personali', to: '/persona/informazioni-personali' },
      { label: 'Overview', to: '/persona/overview' },
      { label: 'Lingue Parlate', to: '/persona/lingue-parlate' },
    ],
  },
  { label: 'Education', to: '/education' },
  {
    label: 'Work',
    children: [
      { label: 'Società', to: '/work/societa' },
      { label: 'Skills', to: '/work/skills' },
      { label: 'Tecnologie', to: '/work/tecnologie' },
      { label: 'Esperienze Lavorative', to: '/work/esperienze-lavorative' },
      { label: 'Mansioni', to: '/work/mansioni' },
    ],
  },
  {
    label: 'Progetti',
    children: [
      { label: 'Progetti', to: '/progetti/progetti' },
      { label: 'Repositories', to: '/progetti/repositories' },
    ],
  },
  {
    label: 'Impostazioni',
    children: [{ label: 'Manutenzione', to: '/impostazioni/manutenzione' }],
  },
];
