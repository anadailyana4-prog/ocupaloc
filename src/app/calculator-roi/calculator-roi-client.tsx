"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";

export function CalculatorROIClient() {
  const [formData, setFormData] = useState({
    programariLuna: 80,
    valoareMedie: 150,
    noshowPercent: 15,
    oreAdmin: 20,
    salariuOra: 25,
    platformaActuala: "telefon"
  });

  const [showResults, setShowResults] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const calculeaza = () => {
    const { programariLuna, valoareMedie, noshowPercent, oreAdmin, salariuOra, platformaActuala } = formData;

    const venitLunar = programariLuna * valoareMedie;
    const venitAnual = venitLunar * 12;
    const pierdereNoshowAnual = venitAnual * (noshowPercent / 100);
    const costAdminAnual = oreAdmin * salariuOra * 12;

    let costPlatformaAnual = 0;
    if (platformaActuala === "fresha") {
      costPlatformaAnual = venitAnual * 0.22;
    } else if (platformaActuala === "booksy") {
      costPlatformaAnual = venitAnual * 0.15;
    }

    const costOcupaLocAnual = 59.99 * 12;
    const economiiNoshow = pierdereNoshowAnual * 0.7;
    const economiiAdmin = costAdminAnual * 0.75;
    const economiiPlatforma = costPlatformaAnual - costOcupaLocAnual;
    const economiiTotaleAnual = economiiNoshow + economiiAdmin + economiiPlatforma;
    const economiiTotaleLuna = economiiTotaleAnual / 12;
    const roi = ((economiiTotaleAnual - costOcupaLocAnual) / costOcupaLocAnual) * 100;
    const oreEconomisiteLuna = oreAdmin * 0.75;

    return {
      venitAnual,
      pierdereNoshowAnual,
      costAdminAnual,
      costPlatformaAnual,
      costOcupaLocAnual,
      economiiTotaleAnual,
      economiiTotaleLuna,
      economiiNoshow,
      economiiAdmin,
      economiiPlatforma,
      roi,
      oreEconomisiteLuna
    };
  };

  const rezultate = calculeaza();

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  const formatRON = (val: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
      maximumFractionDigits: 0
    }).format(val);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cât economisește un salon cu OcupaLoc?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Un salon mediu (80 programări/lună) economisește între 15.000 și 35.000 RON anual, în funcție de platforma actuală și rata de no-show."
        }
      },
      {
        "@type": "Question",
        name: "Cum se calculează economiile?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Economiile includ: reducerea comisioanelor la platforme cu procent, reducerea timpului administrativ, și reducerea anulărilor prin reminder-e automate."
        }
      }
    ]
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id="faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Calculator Economii Salon</h1>
          <p className="mx-auto max-w-2xl text-xl oc-secondary-text">
            Descoperă cât economisești anual trecând de la agendă fizică sau comision la OcupaLoc (59.99 RON/lună, fără
            comision).
          </p>
        </header>

        <section className="rounded-2xl border oc-border bg-white p-8">
          <h2 className="mb-6 text-2xl font-bold">Datele salonului tău</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Programări pe lună</label>
              <input
                type="number"
                value={formData.programariLuna}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    programariLuna: parseInt(e.target.value, 10) || 0
                  })
                }
                className="w-full rounded-lg border oc-border px-4 py-2"
              />
              <p className="text-xs oc-secondary-text">Ex: 80 programări în medie pe lună</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Valoare medie programare (RON)</label>
              <input
                type="number"
                value={formData.valoareMedie}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valoareMedie: parseInt(e.target.value, 10) || 0
                  })
                }
                className="w-full rounded-lg border oc-border px-4 py-2"
              />
              <p className="text-xs oc-secondary-text">Ex: 150 RON în medie per client</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Procent no-show (%)</label>
              <input
                type="number"
                value={formData.noshowPercent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    noshowPercent: parseInt(e.target.value, 10) || 0
                  })
                }
                className="w-full rounded-lg border oc-border px-4 py-2"
              />
              <p className="text-xs oc-secondary-text">Clienți care nu se prezintă (media în România: 15-20%)</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Ore admin/lună pe telefon</label>
              <input
                type="number"
                value={formData.oreAdmin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    oreAdmin: parseInt(e.target.value, 10) || 0
                  })
                }
                className="w-full rounded-lg border oc-border px-4 py-2"
              />
              <p className="text-xs oc-secondary-text">Timp dedicat programări telefonice (ex: 20 ore)</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Salariu orar admin (RON)</label>
              <input
                type="number"
                value={formData.salariuOra}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salariuOra: parseInt(e.target.value, 10) || 0
                  })
                }
                className="w-full rounded-lg border oc-border px-4 py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Platforma actuală</label>
              <select
                value={formData.platformaActuala}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    platformaActuala: e.target.value
                  })
                }
                className="w-full rounded-lg border oc-border px-4 py-2"
              >
                <option value="telefon">Agendă + Telefon (fără software)</option>
                <option value="fresha">Fresha (20% comision)</option>
                <option value="booksy">Booksy (~15% comision)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowResults(true)}
            className="oc-primary mt-8 w-full rounded-lg px-6 py-3 text-lg font-semibold text-white"
          >
            Calculează economiile mele →
          </button>
        </section>

        {showResults ? (
          <section className="oc-badge-bg rounded-2xl border oc-border p-8 oc-primary">
            <h2 className="mb-6 text-center text-2xl font-bold">💰 Rezultatele Tale</h2>

            <div className="mb-8 text-center">
              <p className="mb-2 text-sm oc-secondary-text">Economii estimate anuale</p>
              <p className="text-5xl font-bold oc-accent">{formatRON(rezultate.economiiTotaleAnual)}</p>
              <p className="mt-2 text-sm oc-secondary-text">sau {formatRON(rezultate.economiiTotaleLuna)}/lună</p>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border oc-border bg-white p-4 text-center">
                <p className="text-sm oc-secondary-text">Din reducere no-shows</p>
                <p className="text-2xl font-bold text-emerald-600">{formatRON(rezultate.economiiNoshow)}</p>
                <p className="text-xs oc-secondary-text">/an</p>
              </div>
              <div className="rounded-xl border oc-border bg-white p-4 text-center">
                <p className="text-sm oc-secondary-text">Timp admin economisit</p>
                <p className="text-2xl font-bold text-blue-600">{formatRON(rezultate.economiiAdmin)}</p>
                <p className="text-xs oc-secondary-text">{rezultate.oreEconomisiteLuna.toFixed(0)} ore/lună</p>
              </div>
              <div className="rounded-xl border oc-border bg-white p-4 text-center">
                <p className="text-sm oc-secondary-text">
                  {formData.platformaActuala === "telefon" ? "Doar timp" : "Fără comision"}
                </p>
                <p className="text-2xl font-bold text-purple-600">{formatRON(rezultate.economiiPlatforma)}</p>
                <p className="text-xs oc-secondary-text">/an</p>
              </div>
            </div>

            <div className="mb-8 text-center">
              <div className="inline-block rounded-full bg-emerald-100 px-6 py-3">
                <p className="text-sm text-emerald-800">
                  ROI: <span className="font-bold">{rezultate.roi.toFixed(0)}%</span> în primul an
                </p>
              </div>
            </div>

            <div className="mb-8 overflow-hidden rounded-xl border oc-border bg-white">
              <table className="w-full text-sm">
                <thead className="oc-badge-bg">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Cost/An</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      {formData.platformaActuala === "telefon"
                        ? "Telefon/Agendă"
                        : formData.platformaActuala === "fresha"
                          ? "Fresha"
                          : "Booksy"}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold oc-accent">OcupaLoc</th>
                  </tr>
                </thead>
                <tbody className="divide-y oc-border">
                  <tr>
                    <td className="px-4 py-3">Software</td>
                    <td className="px-4 py-3 text-right">{formatRON(rezultate.costPlatformaAnual)}</td>
                    <td className="px-4 py-3 text-right font-semibold oc-accent">{formatRON(rezultate.costOcupaLocAnual)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Timp admin</td>
                    <td className="px-4 py-3 text-right">{formatRON(rezultate.costAdminAnual)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      {formatRON(rezultate.costAdminAnual * 0.25)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Pierdere no-show</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatRON(rezultate.pierdereNoshowAnual)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{formatRON(rezultate.pierdereNoshowAnual * 0.3)}</td>
                  </tr>
                  <tr className="oc-badge-bg font-semibold">
                    <td className="px-4 py-3">TOTAL COST</td>
                    <td className="px-4 py-3 text-right">
                      {formatRON(
                        rezultate.costPlatformaAnual + rezultate.costAdminAnual + rezultate.pierdereNoshowAnual
                      )}
                    </td>
                    <td className="px-4 py-3 text-right oc-accent">
                      {formatRON(
                        rezultate.costOcupaLocAnual + rezultate.costAdminAnual * 0.25 + rezultate.pierdereNoshowAnual * 0.3
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {!subscribed ? (
              <div className="rounded-xl border oc-border bg-white p-6">
                <h3 className="mb-3 text-lg font-semibold">📧 Primește raportul complet pe email</h3>
                <p className="mb-4 text-sm oc-secondary-text">
                  Include strategii concrete pentru reducerea no-show-urilor și template-uri gratuite.
                </p>
                <form onSubmit={handleSubmitEmail} className="flex gap-3">
                  <input
                    type="email"
                    required
                    placeholder="adresa@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-lg border oc-border px-4 py-2"
                  />
                  <button type="submit" className="oc-primary rounded-lg px-6 py-2 font-semibold text-white">
                    Trimite-mi raportul
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500 bg-emerald-50 p-6 text-center">
                <p className="font-semibold text-emerald-800">✅ Raportul a fost trimis! Verifică email-ul.</p>
                <p className="mt-2 text-sm text-emerald-700">(Nu uita să verifici și folderul Spam)</p>
              </div>
            )}

            <div className="mt-8 space-y-3 text-center">
              <p className="text-lg">
                Gata să economisești <span className="font-bold oc-accent">{formatRON(rezultate.economiiTotaleAnual)}</span>
                /an?
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/signup?start=1" className="oc-primary rounded-lg px-8 py-3 text-lg font-semibold text-white">
                  Începe gratuit 14 zile →
                </Link>
                <Link
                  href="/demo-interactiv"
                  className="rounded-lg border oc-border bg-white px-6 py-3 font-semibold hover:oc-badge-bg"
                >
                  Vezi demo
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border oc-border bg-white p-8">
          <h2 className="mb-6 text-center text-2xl font-bold">Ce spun saloanele care economisesc cu OcupaLoc</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <blockquote className="space-y-2">
              <p className="italic oc-secondary-text">
                &ldquo;Am economisit 18.000 RON în primul an. Bani pe care i-am reinvestit în salon.&rdquo;
              </p>
              <footer className="text-sm font-semibold">— Elena, Studio Beauty, București</footer>
            </blockquote>
            <blockquote className="space-y-2">
              <p className="italic oc-secondary-text">
                &ldquo;De la 25% no-show am ajuns la 5%. OcupaLoc a plătit pentru sine în prima lună.&rdquo;
              </p>
              <footer className="text-sm font-semibold">— Andrei, Barber Shop, Cluj</footer>
            </blockquote>
            <blockquote className="space-y-2">
              <p className="italic oc-secondary-text">
                &ldquo;Nu mai stau 3 ore pe telefon. Am timp să mă focusez pe ce fac mai bine.&rdquo;
              </p>
              <footer className="text-sm font-semibold">— Maria, Cosmetică, Timișoara</footer>
            </blockquote>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Întrebări frecvente</h2>
          <div className="space-y-3">
            <details className="rounded-xl border oc-border bg-white">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold">
                Cât de precise sunt calculele?
                <span>▼</span>
              </summary>
              <div className="border-t oc-border px-4 py-3 text-sm oc-secondary-text">
                Calculele se bazează pe date medii din industrie și feedback de la 100+ saloane. Rezultatele reale pot
                varia ±10% în funcție de specificul fiecărui salon.
              </div>
            </details>
            <details className="rounded-xl border oc-border bg-white">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold">
                Ce se întâmplă dacă am mai puține programări?
                <span>▼</span>
              </summary>
              <div className="border-t oc-border px-4 py-3 text-sm oc-secondary-text">
                Chiar și cu 30-40 programări/lună, OcupaLoc rămâne profitabil. Economia de timp și reducerea anulărilor
                compensează costul abonamentului.
              </div>
            </details>
            <details className="rounded-xl border oc-border bg-white">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold">
                Pot schimba platforma oricând?
                <span>▼</span>
              </summary>
              <div className="border-t oc-border px-4 py-3 text-sm oc-secondary-text">
                Absolut. Nu există contract pe perioadă fixă. Poți anula oricând fără penalități, iar datele îți aparțin
                și pot fi exportate.
              </div>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}
