import { Link } from 'react-router-dom'
import { Section, SectionHeader } from '../section'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { useT } from '@/lib/i18n'

/** Grounded in the actual Rules and KYC/AML pages — no claims the product can't back. */
export function Faq() {
  const t = useT()
  const FAQS = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
    { q: t('faq.q7'), a: t('faq.a7') },
  ]

  return (
    <Section id="faq">
      <div className="grid gap-16 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-24">
        <div>
          <SectionHeader eyebrow={t('faq.eyebrow')} title={t('faq.title')} className="mb-6" />
          <p className="text-base leading-relaxed text-muted">
            {t('faq.introBefore')}
            <Link to="/rules" className="text-brand-fg underline underline-offset-4">
              {t('faq.rulesLink')}
            </Link>
            {t('faq.introMid')}
            <Link to="/kyc" className="text-brand-fg underline underline-offset-4">
              {t('faq.kycLink')}
            </Link>
            {t('faq.introAfter')}
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full border-t border-border">
          {FAQS.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  )
}
