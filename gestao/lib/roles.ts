export type Role='owner'|'sdr';
export function roleFor(email:string):Role|null{const e=email.trim().toLowerCase();return ['maucastello@hotmail.com','mauriciocastellostop@gmail.com'].includes(e)?'owner':e==='karla.domingos@outlook.com'?'sdr':null}
