"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  Camera,
  ChevronRight,
  FileText,
  Globe2,
  Medal,
  Menu,
  Upload,
  Users,
  Video,
  Waves,
  X,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { Footer } from "@/components/Footer";

const features = [
  { icon: Video, title: "Analyse sur ergomètre", text: "Analyse biomécanique complète sur Concept2 et autres." },
  { icon: Waves, title: "Analyse sur l’eau", text: "Suivi précis de votre technique en conditions réelles." },
  { icon: Bot, title: "Assistant IA", text: "Des conseils intelligents et personnalisés pour progresser." },
  { icon: BarChart3, title: "Statistiques avancées", text: "Graphiques détaillés, comparaisons et suivi de progression." },
  { icon: FileText, title: "Rapports automatiques", text: "Rapports PDF professionnels à chaque analyse." },
];

const stats = [
  { icon: Users, value: "1 250+", label: "Athlètes" },
  { icon: Building2, value: "250+", label: "Clubs" },
  { icon: BarChart3, value: "15 000+", label: "Analyses" },
  { icon: Globe2, value: "25+", label: "Pays" },
  { icon: Medal, value: "100%", label: "Dédié à la performance" },
];

export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <main>
      <header className="nav-shell">
        <Brand />

        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Ouvrir le menu">
          {open ? <X /> : <Menu />}
        </button>

        <nav className={open ? "nav-links open" : "nav-links"}>
          <a className="active" href="#accueil">Accueil</a>
          <a href="#fonctionnalites">Fonctionnalités</a>
          <a href="#analyse">Analyse</a>
          <a href="#tarifs">Tarifs</a>
          <a href="#ressources">Ressources</a>
          <a href="#apropos">À propos</a>
        </nav>

        <div className="nav-actions">
          <Link className="button ghost" href="/connexion">Se connecter</Link>
          <Link className="button primary" href="/inscription">Commencer</Link>
        </div>
      </header>

      <section id="accueil" className="hero">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
          <div className="eyebrow"><Activity /> L’IA au service de l’aviron</div>
          <h1>Analysez.<br />Comprenez.<br /><span>Progressez.</span></h1>
          <p>RowMotion AI utilise l’intelligence artificielle et la vision par ordinateur pour analyser votre technique sur ergomètre et sur l’eau. Des données précises pour des performances maximales.</p>
          <div className="hero-actions">
            <Link className="button primary large" href="/connexion"><Upload /> Importer une vidéo</Link>
            <Link className="button ghost large" href="/connexion"><Camera /> Analyse en direct</Link>
          </div>
        </motion.div>

        <div className="metric metric-back"><small>Angle du dos</small><strong>23°</strong><span>● Optimal</span></div>
        <div className="metric metric-cadence"><small>Cadence</small><strong>28 <i>spm</i></strong><svg viewBox="0 0 100 20"><path d="M0 15 L11 10 20 13 28 7 37 14 47 12 57 16 69 9 78 12 88 4 100 8" /></svg></div>
        <div className="metric metric-length"><small>Longueur du coup</small><strong>2.18 <i>m</i></strong><span>● Excellente</span></div>
        <div className="metric metric-knee"><small>Angle du genou</small><strong>87°</strong><span>● Optimal</span></div>
        <div className="metric metric-power"><small>Puissance estimée</small><strong>312 <i>W</i></strong><svg viewBox="0 0 100 20"><path d="M0 14 L10 8 18 13 28 7 38 14 48 9 58 15 69 5 79 7 90 3 100 13" /></svg></div>
      </section>

      <section id="fonctionnalites" className="feature-strip">
        {features.map(({ icon: Icon, title, text }, index) => (
          <motion.article key={title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }}>
            <span className="icon-wrap"><Icon /></span>
            <div><h2>{title}</h2><p>{text}</p></div>
          </motion.article>
        ))}
      </section>

      <section className="stat-strip">
        {stats.map(({ icon: Icon, value, label }) => (
          <div className="stat" key={label}><Icon /><div><strong>{value}</strong><span>{label}</span></div></div>
        ))}
      </section>

      <a className="discover" href="#fonctionnalites">Découvrir RowMotion AI <ChevronRight /></a>
      <Footer />
    </main>
  );
}
