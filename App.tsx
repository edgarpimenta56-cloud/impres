import { useState, useCallback } from 'react'

// ── CSV export utility ─────────────────────────────────────────────────────

function exportCSV(rows: string[][], filename: string) {
  const csvContent = rows
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Types ──────────────────────────────────────────────────────────────────

type Category = 'Instrumento Musical' | 'Acessório Musical' | 'Material de Arte' | 'Áudio/Amplificação' | 'Mobiliário' | 'Eletrônico' | 'Outro'
type EquipmentStatus = 'disponível' | 'emprestado' | 'manutenção'
type QualityRating = 'excelente' | 'bom' | 'regular' | 'ruim'

interface Equipment {
  id: string
  name: string
  category: Category
  serialNumber: string
  description: string
  status: EquipmentStatus
  qualityRating: QualityRating
  qualityNotes: string
  createdAt: string
}

interface Loan {
  id: string
  equipmentId: string
  borrowerName: string
  borrowerContact: string
  borrowerPhone: string
  borrowerRA: string
  borrowerDept: string
  loanDate: string
  expectedReturn: string
  returnDate: string | null
  purpose: string
  preQuality: QualityRating
  preNotes: string
  postQuality: QualityRating | null
  postNotes: string
  status: 'ativo' | 'devolvido'
}

type View = 'dashboard' | 'equipamentos' | 'emprestimos' | 'devolucoes' | 'qualidade' | 'historico'

// ── Storage ────────────────────────────────────────────────────────────────

const STORE_EQ = 'eq_equipment'
const STORE_LOANS = 'eq_loans'

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ── Seed data ──────────────────────────────────────────────────────────────

const SEED_EQUIPMENT: Equipment[] = [
  { id: 'e001', name: 'Violão Michael VM19E Natural', category: 'Instrumento Musical', serialNumber: '', description: 'Violão eletroacústico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e002', name: 'Violão Michael VM19E Natural', category: 'Instrumento Musical', serialNumber: '', description: 'Violão eletroacústico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e003', name: 'Violão Michael VM19E Natural', category: 'Instrumento Musical', serialNumber: '', description: 'Violão eletroacústico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e004', name: 'Violão Michael VM19E Natural', category: 'Instrumento Musical', serialNumber: '', description: 'Violão eletroacústico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e005', name: 'Violão Fender FA-125 CE NAT', category: 'Instrumento Musical', serialNumber: '', description: 'Violão eletroacústico Fender FA-SERIES', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e006', name: 'Ukulele Michael MK23 MH', category: 'Instrumento Musical', serialNumber: '', description: 'Ukulele soprano', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e007', name: 'Ukulele Michael MK23 MH', category: 'Instrumento Musical', serialNumber: '', description: 'Ukulele soprano', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e008', name: 'Ukulele Michael MK23 MH', category: 'Instrumento Musical', serialNumber: '', description: 'Ukulele soprano', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e009', name: 'Ukulele Michael MK23 MHE', category: 'Instrumento Musical', serialNumber: '', description: 'Ukulele eletroacústico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e010', name: 'Ukulele Michael MK23 MHE', category: 'Instrumento Musical', serialNumber: '', description: 'Ukulele eletroacústico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e011', name: 'Triângulo Cromado 30cm x 08mm', category: 'Instrumento Musical', serialNumber: '', description: 'Triângulo percussivo cromado', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e012', name: 'Triângulo Cromado 30cm x 08mm', category: 'Instrumento Musical', serialNumber: '', description: 'Triângulo percussivo cromado', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e013', name: 'Cajon FSA FS2508 Standard', category: 'Instrumento Musical', serialNumber: '', description: 'Cajon percussão FSA Standard', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e014', name: 'Piano Digital Yamaha P45', category: 'Instrumento Musical', serialNumber: '', description: 'Piano digital 88 teclas', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e015', name: 'Suporte Piano Duplo Reforçado', category: 'Acessório Musical', serialNumber: '', description: 'Suporte duplo com regulagem de altura', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e016', name: 'Estante de Partitura Vector SP250', category: 'Acessório Musical', serialNumber: '', description: 'Estante dobrável Vector SP250', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e017', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-01', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e018', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-02', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e019', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-03', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e020', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-04', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e021', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-05', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e022', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-06', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e023', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-07', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e024', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-08', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e025', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-09', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e026', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-10', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e027', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-11', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e028', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-12', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e029', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-13', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e030', name: 'Cadeira Giratória Tecno2000 Hannover M2-001', category: 'Mobiliário', serialNumber: 'jan2011-14', description: 'Cadeira giratória escritório', status: 'disponível', qualityRating: 'regular', qualityNotes: '', createdAt: '2011-01-01T00:00:00Z' },
  { id: 'e031', name: 'Cadeira Flex Form Job L02', category: 'Mobiliário', serialNumber: '', description: 'Cadeira fixa Flex Form', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e032', name: 'Banqueta Madeira SOUSA & CIA. LTDA', category: 'Mobiliário', serialNumber: '', description: 'Banqueta de madeira', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e033', name: 'Banqueta Madeira SOUSA & CIA. LTDA', category: 'Mobiliário', serialNumber: '', description: 'Banqueta de madeira', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e034', name: 'Banqueta Madeira SOUSA & CIA. LTDA', category: 'Mobiliário', serialNumber: '', description: 'Banqueta de madeira', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e035', name: 'Banqueta Madeira SOUSA & CIA. LTDA', category: 'Mobiliário', serialNumber: '', description: 'Banqueta de madeira', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e036', name: 'Banqueta Madeira SOUSA & CIA. LTDA', category: 'Mobiliário', serialNumber: '', description: 'Banqueta de madeira', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e037', name: 'Banqueta Madeira SOUSA & CIA. LTDA', category: 'Mobiliário', serialNumber: '', description: 'Banqueta de madeira', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e038', name: 'Banqueta Madeira', category: 'Mobiliário', serialNumber: '', description: 'Banqueta de madeira s/ marca', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e039', name: 'Mesa Desenho Técnico Trident Desetec CV03 REF 6315', category: 'Mobiliário', serialNumber: 'REF6315-01', description: 'Mesa de desenho técnico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e040', name: 'Mesa Desenho Técnico Trident Desetec CV03 REF 6315', category: 'Mobiliário', serialNumber: 'REF6315-02', description: 'Mesa de desenho técnico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e041', name: 'Mesa Desenho Técnico Trident Desetec CV03 REF 6315', category: 'Mobiliário', serialNumber: 'REF6315-03', description: 'Mesa de desenho técnico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e042', name: 'Mesa Desenho Técnico Trident Desetec CV03 REF 6315', category: 'Mobiliário', serialNumber: 'REF6315-04', description: 'Mesa de desenho técnico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e043', name: 'Mesa Desenho Técnico Trident Desetec CV03 REF 6315', category: 'Mobiliário', serialNumber: 'REF6315-05', description: 'Mesa de desenho técnico', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e044', name: 'Cavalete de Pintura SOUSA & CIA. LTDA', category: 'Material de Arte', serialNumber: '', description: 'Cavalete para pintura artística', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e045', name: 'Cavalete de Pintura SOUSA & CIA. LTDA', category: 'Material de Arte', serialNumber: '', description: 'Cavalete para pintura artística', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e046', name: 'Caixa de Som Imenso X62', category: 'Áudio/Amplificação', serialNumber: '', description: 'Caixa de som amplificada', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e047', name: 'Caixa de Som Amvox ACA 501 New', category: 'Áudio/Amplificação', serialNumber: '', description: 'Caixa amplificada Amvox', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e048', name: 'Amplificador Baixo Borne Impact Bass CB60', category: 'Áudio/Amplificação', serialNumber: '', description: 'Amplificador para baixo elétrico, 60W', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e049', name: 'Ventilador de Teto Venti-Delta Comercial Eco 3 Pás', category: 'Eletrônico', serialNumber: '', description: 'Ventilador de teto comercial', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e050', name: 'Ventilador de Teto Comercial 150W/180W Preto', category: 'Eletrônico', serialNumber: '', description: 'Ventilador de teto comercial preto', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e051', name: 'Mesa para Computador', category: 'Mobiliário', serialNumber: '', description: 'Mesa para uso com computador', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e052', name: 'Carteira Escolar Preta', category: 'Mobiliário', serialNumber: '', description: 'Carteira escolar individual preta', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e053', name: 'Microfone VWS 20 Plus', category: 'Áudio/Amplificação', serialNumber: '', description: 'Microfone sem fio VWS', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e054', name: 'Mesa de Som Behringer Eurodesk UB1204FX-Pro', category: 'Áudio/Amplificação', serialNumber: '', description: 'Mesa de som 12 canais com efeitos', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e055', name: 'Armário de Aço 2 Portas', category: 'Mobiliário', serialNumber: '', description: 'Armário metálico 2 portas', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e056', name: 'Armário de Aço 2 Portas', category: 'Mobiliário', serialNumber: '', description: 'Armário metálico 2 portas', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e057', name: 'Armário de Aço 2 Portas', category: 'Mobiliário', serialNumber: '', description: 'Armário metálico 2 portas', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e058', name: 'Arquivo 4 Gavetas', category: 'Mobiliário', serialNumber: '', description: 'Arquivo vertical 4 gavetas', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e059', name: 'Arquivo 4 Gavetas Azul', category: 'Mobiliário', serialNumber: '', description: 'Arquivo vertical 4 gavetas, cor azul', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e060', name: 'Armário Madeira 2 Portas Escritório', category: 'Mobiliário', serialNumber: '', description: 'Armário de madeira para escritório', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e061', name: 'Armário Grande Azul Metalsul', category: 'Mobiliário', serialNumber: '', description: 'Armário grande metálico azul Metalsul', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e062', name: 'Mesa Madeira Branca Escritório', category: 'Mobiliário', serialNumber: '', description: 'Mesa de madeira branca para escritório', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e063', name: 'Mesa Madeira Branca Escritório', category: 'Mobiliário', serialNumber: '', description: 'Mesa de madeira branca para escritório', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e064', name: 'Lixeira Grande Aberta', category: 'Outro', serialNumber: '', description: 'Lixeira grande sem tampa', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e065', name: 'Banqueta Redonda com Regulagem de Altura', category: 'Mobiliário', serialNumber: '', description: 'Banqueta redonda regulável', status: 'disponível', qualityRating: 'bom', qualityNotes: '', createdAt: '2024-01-01T00:00:00Z' },
]

const SEED_LOANS: Loan[] = []

// ── Quality badge ──────────────────────────────────────────────────────────

const qualityColors: Record<QualityRating, string> = {
  excelente: '#16a34a',
  bom: '#2563eb',
  regular: '#d97706',
  ruim: '#dc2626',
}

function QBadge({ rating }: { rating: QualityRating }) {
  const labels: Record<QualityRating, string> = { excelente: 'Excelente', bom: 'Bom', regular: 'Regular', ruim: 'Ruim' }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider"
      style={{ backgroundColor: qualityColors[rating] + '18', color: qualityColors[rating] }}
    >
      {labels[rating]}
    </span>
  )
}

function StatusBadge({ status }: { status: EquipmentStatus | 'ativo' | 'devolvido' }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    disponível:  { label: 'Disponível',  bg: '#dcfce7', color: '#15803d' },
    emprestado:  { label: 'Emprestado',  bg: '#fef3c7', color: '#b45309' },
    manutenção:  { label: 'Manutenção',  bg: '#fee2e2', color: '#b91c1c' },
    ativo:       { label: 'Ativo',       bg: '#fef3c7', color: '#b45309' },
    devolvido:   { label: 'Devolvido',   bg: '#dcfce7', color: '#15803d' },
  }
  const s = map[status] ?? { label: status, bg: '#f1f5f9', color: '#475569' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard',   label: 'Painel',         icon: '⬛' },
  { id: 'equipamentos',label: 'Equipamentos',   icon: '🎸' },
  { id: 'emprestimos', label: 'Empréstimos',    icon: '📤' },
  { id: 'devolucoes',  label: 'Devoluções',     icon: '📥' },
  { id: 'qualidade',   label: 'Qualidade',      icon: '🔍' },
  { id: 'historico',   label: 'Histórico',      icon: '📋' },
]

function Sidebar({ view, setView, counts }: { view: View; setView: (v: View) => void; counts: Record<string, number> }) {
  return (
    <aside
      className="fixed left-0 top-0 h-full w-56 flex flex-col z-20"
      style={{ backgroundColor: 'var(--primary)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="px-5 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>E</div>
          <span className="font-bold text-white tracking-tight text-sm">Arte e Cultura </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--sidebar-foreground)', marginLeft: '36px' }}>Sistema de Empréstimos</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all text-left"
            style={{
              backgroundColor: view === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: view === item.id ? '#fff' : 'var(--sidebar-foreground)',
              fontWeight: view === item.id ? 600 : 400,
            }}
          >
            <span className="text-base leading-none" style={{ opacity: view === item.id ? 1 : 0.6 }}>{item.icon}</span>
            <span>{item.label}</span>
            {counts[item.id] != null && counts[item.id] > 0 && (
              <span className="ml-auto text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: item.id === 'emprestimos' ? 'var(--accent)' : 'rgba(255,255,255,0.12)', color: '#fff' }}>
                {counts[item.id]}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => { localStorage.removeItem('eq_equipment'); localStorage.removeItem('eq_loans'); window.location.reload() }}
          className="text-xs w-full text-left hover:opacity-80 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.28)' }}
          title="Restaurar inventário padrão"
        >
          ↺ Restaurar inventário
        </button>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>v1.0 · {new Date().getFullYear()}</p>
      </div>
    </aside>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────

function Stat({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      <p className="text-3xl font-bold tracking-tight" style={{ color: accent ? 'var(--accent)' : 'var(--foreground)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────

function Dashboard({ equipment, loans }: { equipment: Equipment[]; loans: Loan[] }) {
  const available = equipment.filter(e => e.status === 'disponível').length
  const loaned = equipment.filter(e => e.status === 'emprestado').length
  const maintenance = equipment.filter(e => e.status === 'manutenção').length
  const activeLoans = loans.filter(l => l.status === 'ativo')
  const overdue = activeLoans.filter(l => l.expectedReturn < today()).length

  const recentLoans = [...loans].sort((a, b) => b.loanDate.localeCompare(a.loanDate)).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Painel Geral</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Visão geral do acervo e empréstimos ativos</p>
      </div>

      <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <Stat label="Disponíveis" value={available} sub="prontos para empréstimo" />
        <Stat label="Emprestados" value={loaned} sub="em uso no momento" accent />
        <Stat label="Manutenção" value={maintenance} sub="fora de circulação" />
        <Stat label="Em atraso" value={overdue} sub="prazo de devolução vencido" accent={overdue > 0} />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold">Empréstimos Recentes</h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentLoans.length === 0 && (
              <p className="px-5 py-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>Nenhum empréstimo registrado ainda.</p>
            )}
            {recentLoans.map(loan => {
              const eq = equipment.find(e => e.id === loan.equipmentId)
              return (
                <div key={loan.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{eq?.name ?? '—'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{loan.borrowerName} · {fmtDate(loan.loanDate)}</p>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold">Estado do Acervo</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            {(['excelente', 'bom', 'regular', 'ruim'] as QualityRating[]).map(q => {
              const count = equipment.filter(e => e.qualityRating === q).length
              const pct = equipment.length ? Math.round((count / equipment.length) * 100) : 0
              const labels = { excelente: 'Excelente', bom: 'Bom', regular: 'Regular', ruim: 'Ruim' }
              return (
                <div key={q}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{labels[q]}</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--muted)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: qualityColors[q] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Equipment view ────────────────────────────────────────────────────────

const CATEGORIES: Category[] = ['Instrumento Musical', 'Acessório Musical', 'Material de Arte', 'Áudio/Amplificação', 'Mobiliário', 'Eletrônico', 'Outro']

function EquipmentView({ equipment, setEquipment }: { equipment: Equipment[]; setEquipment: (e: Equipment[]) => void }) {
  const [filter, setFilter] = useState<EquipmentStatus | 'todos'>('todos')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Equipment | null>(null)
  const [form, setForm] = useState<Omit<Equipment, 'id' | 'createdAt'>>({
    name: '', category: 'Instrumento Musical', serialNumber: '', description: '',
    status: 'disponível', qualityRating: 'bom', qualityNotes: '',
  })

  const openNew = () => {
    setEditItem(null)
    setForm({ name: '', category: 'Instrumento Musical', serialNumber: '', description: '', status: 'disponível', qualityRating: 'bom', qualityNotes: '' })
    setShowForm(true)
  }

  const openEdit = (eq: Equipment) => {
    setEditItem(eq)
    setForm({ name: eq.name, category: eq.category, serialNumber: eq.serialNumber, description: eq.description, status: eq.status, qualityRating: eq.qualityRating, qualityNotes: eq.qualityNotes })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editItem) {
      const updated = equipment.map(e => e.id === editItem.id ? { ...editItem, ...form } : e)
      setEquipment(updated)
    } else {
      const newEq: Equipment = { ...form, id: uid(), createdAt: new Date().toISOString() }
      setEquipment([...equipment, newEq])
    }
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    setEquipment(equipment.filter(e => e.id !== id))
  }

  const filtered = equipment.filter(e => {
    const matchStatus = filter === 'todos' || e.status === filter
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.serialNumber.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const handleExport = () => {
    const rows = [
      ['ID', 'Equipamento', 'Categoria', 'Nº Série', 'Status', 'Qualidade', 'Descrição', 'Observações', 'Cadastrado em'],
      ...filtered.map(e => [e.id, e.name, e.category, e.serialNumber, e.status, e.qualityRating, e.description, e.qualityNotes, fmtDate(e.createdAt)]),
    ]
    exportCSV(rows, `equipamentos-${today()}.csv`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Equipamentos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{equipment.length} itens cadastrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80" style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
            ↓ Exportar CSV
          </button>
          <button onClick={openNew} className="px-4 py-2 rounded text-sm font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>
            + Novo Equipamento
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou número de série..."
          className="flex-1 px-3 py-2 rounded text-sm outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="px-3 py-2 rounded text-sm outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
          <option value="todos">Todos</option>
          <option value="disponível">Disponíveis</option>
          <option value="emprestado">Emprestados</option>
          <option value="manutenção">Manutenção</option>
        </select>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
              {['Equipamento', 'Categoria', 'Nº Série', 'Status', 'Qualidade', 'Ações'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>Nenhum equipamento encontrado.</td></tr>
            )}
            {filtered.map(eq => (
              <tr key={eq.id} className="border-b transition-colors hover:bg-[#f9fafb]" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3">
                  <p className="font-medium">{eq.name}</p>
                  {eq.description && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{eq.description}</p>}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>{eq.category}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{eq.serialNumber || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={eq.status} /></td>
                <td className="px-4 py-3"><QBadge rating={eq.qualityRating} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(eq)} className="text-xs px-2.5 py-1 rounded hover:opacity-80 transition-opacity" style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}>Editar</button>
                    <button onClick={() => handleDelete(eq.id)} className="text-xs px-2.5 py-1 rounded hover:opacity-80 transition-opacity" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editItem ? 'Editar Equipamento' : 'Novo Equipamento'} onClose={() => setShowForm(false)} onSave={handleSave}>
          <Field label="Nome do equipamento *">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="field-input" placeholder="Ex: Violão Yamaha F310" />
          </Field>
          <Field label="Categoria">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Category })} className="field-input">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Número de série">
            <input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} className="field-input" placeholder="Ex: YM-F310-0042" />
          </Field>
          <Field label="Descrição">
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="field-input" placeholder="Breve descrição do item" />
          </Field>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Status">
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as EquipmentStatus })} className="field-input">
                <option value="disponível">Disponível</option>
                <option value="emprestado">Emprestado</option>
                <option value="manutenção">Manutenção</option>
              </select>
            </Field>
            <Field label="Qualidade">
              <select value={form.qualityRating} onChange={e => setForm({ ...form, qualityRating: e.target.value as QualityRating })} className="field-input">
                <option value="excelente">Excelente</option>
                <option value="bom">Bom</option>
                <option value="regular">Regular</option>
                <option value="ruim">Ruim</option>
              </select>
            </Field>
          </div>
          <Field label="Observações de qualidade">
            <textarea value={form.qualityNotes} onChange={e => setForm({ ...form, qualityNotes: e.target.value })} className="field-input resize-none" rows={2} placeholder="Descreva o estado atual do equipamento..." />
          </Field>
        </Modal>
      )}
    </div>
  )
}

// ── Loans view ────────────────────────────────────────────────────────────

function LoansView({ equipment, loans, setLoans, setEquipment }: { equipment: Equipment[]; loans: Loan[]; setLoans: (l: Loan[]) => void; setEquipment: (e: Equipment[]) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<Loan, 'id' | 'returnDate' | 'postQuality' | 'postNotes' | 'status'>>({
    equipmentId: '', borrowerName: '', borrowerContact: '', borrowerPhone: '', borrowerRA: '', borrowerDept: '',
    loanDate: today(), expectedReturn: '', purpose: '', preQuality: 'bom', preNotes: '',
  })

  const available = equipment.filter(e => e.status === 'disponível')
  const active = loans.filter(l => l.status === 'ativo')

  const handleSave = () => {
    if (!form.equipmentId || !form.borrowerName.trim() || !form.expectedReturn) return
    const loan: Loan = { ...form, id: uid(), returnDate: null, postQuality: null, postNotes: '', status: 'ativo' }
    setLoans([...loans, loan])
    setEquipment(equipment.map(e => e.id === form.equipmentId ? { ...e, status: 'emprestado' } : e))
    setForm({ equipmentId: '', borrowerName: '', borrowerContact: '', borrowerPhone: '', borrowerRA: '', borrowerDept: '', loanDate: today(), expectedReturn: '', purpose: '', preQuality: 'bom', preNotes: '' })
    setShowForm(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Empréstimos Ativos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{active.length} empréstimo{active.length !== 1 ? 's' : ''} em aberto</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>
          + Registrar Empréstimo
        </button>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
              {['Equipamento', 'Responsável', 'Setor', 'Emprestado em', 'Prazo', 'Qualidade Saída', 'Situação'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>Nenhum empréstimo ativo no momento.</td></tr>
            )}
            {active.map(loan => {
              const eq = equipment.find(e => e.id === loan.equipmentId)
              const overdue = loan.expectedReturn < today()
              return (
                <tr key={loan.id} className="border-b hover:bg-[#f9fafb] transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-medium">{eq?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p>{loan.borrowerName}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{loan.borrowerContact}</p>
                    {loan.borrowerPhone && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{loan.borrowerPhone}</p>}
                    {loan.borrowerRA && <p className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>RA: {loan.borrowerRA}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>{loan.borrowerDept}</td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtDate(loan.loanDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs ${overdue ? 'font-bold' : ''}`} style={{ color: overdue ? '#dc2626' : 'var(--foreground)' }}>
                      {fmtDate(loan.expectedReturn)}{overdue ? ' ⚠' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3"><QBadge rating={loan.preQuality} /></td>
                  <td className="px-4 py-3"><StatusBadge status="ativo" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Registrar Empréstimo" onClose={() => setShowForm(false)} onSave={handleSave}>
          <Field label="Equipamento *">
            <select value={form.equipmentId} onChange={e => setForm({ ...form, equipmentId: e.target.value })} className="field-input">
              <option value="">Selecione um equipamento disponível...</option>
              {available.map(e => <option key={e.id} value={e.id}>{e.name} — {e.serialNumber}</option>)}
            </select>
          </Field>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Nome do responsável *">
              <input value={form.borrowerName} onChange={e => setForm({ ...form, borrowerName: e.target.value })} className="field-input" placeholder="Nome completo" />
            </Field>
            <Field label="Setor / Departamento">
              <input value={form.borrowerDept} onChange={e => setForm({ ...form, borrowerDept: e.target.value })} className="field-input" placeholder="Ex: Oficina de Música" />
            </Field>
          </div>
          <Field label="E-mail">
            <input value={form.borrowerContact} onChange={e => setForm({ ...form, borrowerContact: e.target.value })} className="field-input" placeholder="email@exemplo.com" />
          </Field>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Telefone">
              <input value={form.borrowerPhone} onChange={e => setForm({ ...form, borrowerPhone: e.target.value })} className="field-input" placeholder="(00) 00000-0000" />
            </Field>
            <Field label="RA (Registro do Aluno)">
              <input value={form.borrowerRA} onChange={e => setForm({ ...form, borrowerRA: e.target.value })} className="field-input" placeholder="Ex: 2024001234" />
            </Field>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Data do empréstimo">
              <input type="date" value={form.loanDate} onChange={e => setForm({ ...form, loanDate: e.target.value })} className="field-input" />
            </Field>
            <Field label="Prazo de devolução *">
              <input type="date" value={form.expectedReturn} onChange={e => setForm({ ...form, expectedReturn: e.target.value })} className="field-input" />
            </Field>
          </div>
          <Field label="Finalidade do empréstimo">
            <input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} className="field-input" placeholder="Ex: Evento de cultura, aula, apresentação..." />
          </Field>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Qualidade na saída">
              <select value={form.preQuality} onChange={e => setForm({ ...form, preQuality: e.target.value as QualityRating })} className="field-input">
                <option value="excelente">Excelente</option>
                <option value="bom">Bom</option>
                <option value="regular">Regular</option>
                <option value="ruim">Ruim</option>
              </select>
            </Field>
          </div>
          <Field label="Observações antes do empréstimo">
            <textarea value={form.preNotes} onChange={e => setForm({ ...form, preNotes: e.target.value })} className="field-input resize-none" rows={2} placeholder="Estado do equipamento ao sair..." />
          </Field>
        </Modal>
      )}
    </div>
  )
}

// ── Returns view ──────────────────────────────────────────────────────────

function ReturnsView({ equipment, loans, setLoans, setEquipment }: { equipment: Equipment[]; loans: Loan[]; setLoans: (l: Loan[]) => void; setEquipment: (e: Equipment[]) => void }) {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [form, setForm] = useState({ returnDate: today(), postQuality: 'bom' as QualityRating, postNotes: '' })

  const active = loans.filter(l => l.status === 'ativo')

  const handleReturn = () => {
    if (!selectedLoan) return
    const updated = loans.map(l =>
      l.id === selectedLoan.id
        ? { ...l, returnDate: form.returnDate, postQuality: form.postQuality, postNotes: form.postNotes, status: 'devolvido' as const }
        : l
    )
    setLoans(updated)
    setEquipment(equipment.map(e => e.id === selectedLoan.equipmentId
      ? { ...e, status: 'disponível' as EquipmentStatus, qualityRating: form.postQuality, qualityNotes: form.postNotes || e.qualityNotes }
      : e
    ))
    setSelectedLoan(null)
    setForm({ returnDate: today(), postQuality: 'bom', postNotes: '' })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Registro de Devolução</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Selecione um empréstimo ativo para registrar a devolução</p>
      </div>

      {active.length === 0 && (
        <div className="rounded-lg px-6 py-12 text-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Não há empréstimos ativos para devolução.</p>
        </div>
      )}

      <div className="grid gap-3">
        {active.map(loan => {
          const eq = equipment.find(e => e.id === loan.equipmentId)
          const overdue = loan.expectedReturn < today()
          const isSelected = selectedLoan?.id === loan.id

          return (
            <div
              key={loan.id}
              className="rounded-lg p-4 cursor-pointer transition-all"
              style={{
                backgroundColor: 'var(--card)',
                border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
              }}
              onClick={() => setSelectedLoan(isSelected ? null : loan)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{eq?.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {loan.borrowerName} · {loan.borrowerDept} · Emprestado em {fmtDate(loan.loanDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {overdue && <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>ATRASADO</span>}
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Prazo: {fmtDate(loan.expectedReturn)}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>{isSelected ? '▲ Fechar' : '▼ Registrar devolução'}</span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
                  <div className="rounded p-3 text-xs space-y-1" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    <p><strong>Qualidade na saída:</strong> {loan.preQuality} — {loan.preNotes || 'Sem observações'}</p>
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <Field label="Data de devolução">
                      <input type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} className="field-input" />
                    </Field>
                    <Field label="Qualidade na chegada">
                      <select value={form.postQuality} onChange={e => setForm({ ...form, postQuality: e.target.value as QualityRating })} className="field-input">
                        <option value="excelente">Excelente</option>
                        <option value="bom">Bom</option>
                        <option value="regular">Regular</option>
                        <option value="ruim">Ruim</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Observações pós-devolução">
                    <textarea value={form.postNotes} onChange={e => setForm({ ...form, postNotes: e.target.value })} className="field-input resize-none" rows={2} placeholder="Estado ao retornar, danos ou observações..." />
                  </Field>
                  <button onClick={handleReturn} className="px-5 py-2 rounded text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#15803d', color: '#fff' }}>
                    Confirmar Devolução
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Quality view ──────────────────────────────────────────────────────────

function QualityView({ equipment, setEquipment }: { equipment: Equipment[]; setEquipment: (e: Equipment[]) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ qualityRating: 'bom' as QualityRating, qualityNotes: '', status: 'disponível' as EquipmentStatus })
  const [saved, setSaved] = useState<string | null>(null)

  const handleSelect = (eq: Equipment) => {
    setSelectedId(eq.id)
    setForm({ qualityRating: eq.qualityRating, qualityNotes: eq.qualityNotes, status: eq.status })
    setSaved(null)
  }

  const handleSave = () => {
    if (!selectedId) return
    setEquipment(equipment.map(e => e.id === selectedId ? { ...e, ...form } : e))
    setSaved(selectedId)
  }

  const selected = equipment.find(e => e.id === selectedId)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Verificação de Qualidade</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Inspecione e atualize o estado de funcionamento dos equipamentos</p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', backgroundColor: 'var(--muted)' }}>
            Selecionar Equipamento
          </div>
          <div className="divide-y overflow-y-auto" style={{ borderColor: 'var(--border)', maxHeight: '420px' }}>
            {equipment.map(eq => (
              <button
                key={eq.id}
                onClick={() => handleSelect(eq)}
                className="w-full px-4 py-3 text-left transition-colors"
                style={{
                  backgroundColor: selectedId === eq.id ? 'var(--secondary)' : 'transparent',
                  borderLeft: selectedId === eq.id ? '3px solid var(--primary)' : '3px solid transparent',
                }}
              >
                <p className="text-sm font-medium">{eq.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <QBadge rating={eq.qualityRating} />
                  <StatusBadge status={eq.status} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          {!selected ? (
            <div className="flex items-center justify-center h-full py-20 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              ← Selecione um equipamento para inspecionar
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div>
                <h2 className="font-bold text-base">{selected.name}</h2>
                <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--muted-foreground)' }}>{selected.serialNumber} · {selected.category}</p>
              </div>

              <div className="p-3 rounded text-xs" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                <strong>Último registro:</strong> {selected.qualityNotes || 'Sem observações anteriores.'}
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <Field label="Nova avaliação de qualidade">
                  <select value={form.qualityRating} onChange={e => setForm({ ...form, qualityRating: e.target.value as QualityRating })} className="field-input">
                    <option value="excelente">Excelente</option>
                    <option value="bom">Bom</option>
                    <option value="regular">Regular</option>
                    <option value="ruim">Ruim</option>
                  </select>
                </Field>
                <Field label="Status do equipamento">
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as EquipmentStatus })} className="field-input" disabled={selected.status === 'emprestado'}>
                    <option value="disponível">Disponível</option>
                    <option value="manutenção">Manutenção</option>
                    {selected.status === 'emprestado' && <option value="emprestado">Emprestado</option>}
                  </select>
                </Field>
              </div>

              <Field label="Observações de inspeção">
                <textarea value={form.qualityNotes} onChange={e => setForm({ ...form, qualityNotes: e.target.value })} className="field-input resize-none" rows={3} placeholder="Descreva o estado atual, problemas encontrados, reparos necessários..." />
              </Field>

              <div className="flex items-center gap-3">
                <button onClick={handleSave} className="px-5 py-2 rounded text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>
                  Salvar Inspeção
                </button>
                {saved === selected.id && (
                  <span className="text-sm font-medium" style={{ color: '#16a34a' }}>✓ Salvo com sucesso</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── History view ──────────────────────────────────────────────────────────

function HistoryView({ equipment, loans }: { equipment: Equipment[]; loans: Loan[] }) {
  const [filter, setFilter] = useState<'todos' | 'ativo' | 'devolvido'>('todos')
  const [search, setSearch] = useState('')

  const filtered = loans
    .filter(l => filter === 'todos' || l.status === filter)
    .filter(l => {
      if (!search) return true
      const eq = equipment.find(e => e.id === l.equipmentId)
      return (
        eq?.name.toLowerCase().includes(search.toLowerCase()) ||
        l.borrowerName.toLowerCase().includes(search.toLowerCase())
      )
    })
    .sort((a, b) => b.loanDate.localeCompare(a.loanDate))

  const handleExport = () => {
    const rows = [
      ['ID', 'Equipamento', 'Responsável', 'E-mail', 'Telefone', 'RA', 'Setor', 'Empréstimo', 'Prazo', 'Devolvido em', 'Finalidade', 'Qualidade Saída', 'Obs. Saída', 'Qualidade Retorno', 'Obs. Retorno', 'Status'],
      ...filtered.map(l => {
        const eq = equipment.find(e => e.id === l.equipmentId)
        return [l.id, eq?.name ?? '—', l.borrowerName, l.borrowerContact, l.borrowerPhone, l.borrowerRA, l.borrowerDept, fmtDate(l.loanDate), fmtDate(l.expectedReturn), l.returnDate ? fmtDate(l.returnDate) : '', l.purpose, l.preQuality, l.preNotes, l.postQuality ?? '', l.postNotes, l.status]
      }),
    ]
    exportCSV(rows, `historico-emprestimos-${today()}.csv`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Histórico de Empréstimos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{loans.length} registro{loans.length !== 1 ? 's' : ''} no total</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80" style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
          ↓ Exportar CSV
        </button>
      </div>

      <div className="flex gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por equipamento ou responsável..."
          className="flex-1 px-3 py-2 rounded text-sm outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="px-3 py-2 rounded text-sm outline-none" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
          <option value="todos">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="devolvido">Devolvidos</option>
        </select>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
              {['Equipamento', 'Responsável', 'Empréstimo', 'Devolução Prevista', 'Devolvido em', 'Qualidade Saída', 'Qualidade Retorno', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>Nenhum registro encontrado.</td></tr>
            )}
            {filtered.map(loan => {
              const eq = equipment.find(e => e.id === loan.equipmentId)
              return (
                <tr key={loan.id} className="border-b hover:bg-[#f9fafb] transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-medium">{eq?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p>{loan.borrowerName}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{loan.borrowerDept}</p>
                    {loan.borrowerPhone && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{loan.borrowerPhone}</p>}
                    {loan.borrowerRA && <p className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>RA: {loan.borrowerRA}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtDate(loan.loanDate)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{fmtDate(loan.expectedReturn)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{loan.returnDate ? fmtDate(loan.returnDate) : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}</td>
                  <td className="px-4 py-3"><QBadge rating={loan.preQuality} /></td>
                  <td className="px-4 py-3">{loan.postQuality ? <QBadge rating={loan.postQuality} /> : <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>—</span>}</td>
                  <td className="px-4 py-3"><StatusBadge status={loan.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, children, onClose, onSave }: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-base">{title}</h2>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--muted-foreground)' }}>×</button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
        <div className="px-6 py-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded text-sm font-medium" style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}>Cancelar</button>
          <button onClick={onSave} className="px-4 py-2 rounded text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ── Root app ──────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [equipment, setEquipmentRaw] = useState<Equipment[]>(() => {
    const stored = load<Equipment[]>(STORE_EQ, [])
    return stored.length ? stored : SEED_EQUIPMENT
  })
  const [loans, setLoansRaw] = useState<Loan[]>(() => {
    const stored = load<Loan[]>(STORE_LOANS, [])
    return stored.length ? stored : SEED_LOANS
  })

  const setEquipment = useCallback((e: Equipment[]) => { setEquipmentRaw(e); save(STORE_EQ, e) }, [])
  const setLoans = useCallback((l: Loan[]) => { setLoansRaw(l); save(STORE_LOANS, l) }, [])

  const counts: Record<string, number> = {
    emprestimos: loans.filter(l => l.status === 'ativo').length,
    devolucoes: loans.filter(l => l.status === 'ativo').length,
  }

  return (
    <>
      <style>{`
        .field-input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background-color: var(--background);
          color: var(--foreground);
          font-size: 13px;
          outline: none;
          font-family: var(--font-sans);
          transition: border-color 0.15s;
        }
        .field-input:focus {
          border-color: var(--ring);
        }
      `}</style>

      <div className="flex min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <Sidebar view={view} setView={setView} counts={counts} />

        <main className="flex-1 ml-56 min-h-screen p-8" style={{ maxWidth: 'calc(100vw - 224px)' }}>
          {view === 'dashboard' && <Dashboard equipment={equipment} loans={loans} />}
          {view === 'equipamentos' && <EquipmentView equipment={equipment} setEquipment={setEquipment} />}
          {view === 'emprestimos' && <LoansView equipment={equipment} loans={loans} setLoans={setLoans} setEquipment={setEquipment} />}
          {view === 'devolucoes' && <ReturnsView equipment={equipment} loans={loans} setLoans={setLoans} setEquipment={setEquipment} />}
          {view === 'qualidade' && <QualityView equipment={equipment} setEquipment={setEquipment} />}
          {view === 'historico' && <HistoryView equipment={equipment} loans={loans} />}
        </main>
      </div>
    </>
  )
}
