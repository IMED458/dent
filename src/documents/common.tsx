import React from 'react';
import type { ClinicSettings } from '../lib/types';

export function SheetHeader({ clinic, formCode, right }: { clinic: ClinicSettings; formCode?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderBottom: '1.5px solid #000', paddingBottom: 6, marginBottom: 8, breakInside: 'avoid' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: '1 1 auto', minWidth: 0 }}>
        {clinic.logo && <img src={clinic.logo} alt="" style={{ height: 44, width: 'auto' }} />}
        <div className="small" style={{ lineHeight: 1.35 }}>
          <div style={{ fontWeight: 700, fontSize: '11pt' }}>{clinic.legalName || clinic.name}</div>
          {clinic.legalName && clinic.name !== clinic.legalName && <div>{clinic.name}</div>}
          {clinic.address && <div>{clinic.address}</div>}
          <div>
            {clinic.taxId && <>ს/კ {clinic.taxId} </>}
            {clinic.phone && <>· ტელ. {clinic.phone} </>}
            {clinic.email && <>· {clinic.email}</>}
          </div>
          {clinic.license && <div>სამედიცინო საქმიანობის ლიცენზია/ნებართვა: {clinic.license}</div>}
        </div>
      </div>
      <div className="small" style={{ textAlign: 'right', flex: '0 0 auto', maxWidth: '40%' }}>
        {formCode && <div style={{ fontWeight: 700 }}>{formCode}</div>}
        {right}
      </div>
    </div>
  );
}

export function Row({ label, value, wide }: { label: string; value?: React.ReactNode; wide?: boolean }) {
  return (
    <div className="row" style={wide ? { flexDirection: 'column', gap: 1 } : undefined}>
      <span className="lbl">{label}</span>
      <span className="val">{value || ' '}</span>
    </div>
  );
}

export function Box({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <>
      <div className="lbl" style={{ marginTop: 6 }}>
        {label}
      </div>
      <div className="box">{value || ' '}</div>
    </>
  );
}

export function Signatures({ left, right, center }: { left: React.ReactNode; right?: React.ReactNode; center?: React.ReactNode }) {
  return (
    <div className="sign">
      <div>{left}</div>
      {center && <div>{center}</div>}
      <div>{right || 'ხელმოწერა'}</div>
    </div>
  );
}

export function FooterNote({ clinic, children }: { clinic: ClinicSettings; children?: React.ReactNode }) {
  return (
    <div className="small" style={{ marginTop: 18, color: '#333' }}>
      {children}
      {clinic.footerNote && <div style={{ marginTop: 4 }}>{clinic.footerNote}</div>}
    </div>
  );
}
