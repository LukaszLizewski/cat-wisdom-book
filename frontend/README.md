# Kocia Księga Mądrości — Frontend

Frontend aplikacji **Kocia Księga Mądrości** (Cat's Book of Wisdom), zbudowany
w React + TypeScript + Vite. Komunikuje się z backendem Spring Boot pod
bazowym adresem `/api`.

## Wymagania

- Node.js 20+
- npm

## Instalacja

```bash
npm install
```

## Uruchomienie w trybie deweloperskim

```bash
npm run dev
```

Aplikacja domyślnie działa pod `http://localhost:5173`. Wszystkie żądania do
`/api` są przekierowywane (proxy, patrz `vite.config.ts`) na
`http://localhost:8080`, gdzie w trybie lokalnym powinien działać backend
Spring Boot. Skonfiguruj bazowy adres API przez zmienną środowiskową
`VITE_API_BASE_URL` (patrz `.env.example`) — domyślnie `/api`.

## Budowanie do produkcji

```bash
npm run build
```

Wynikowe pliki statyczne trafiają do katalogu `dist/`. W produkcji backend
Spring Boot serwuje je z tego samego origin (bez potrzeby proxy — zobacz
`docs/ARCHITECTURE.md` w repozytorium głównym).

## Podgląd builda produkcyjnego

```bash
npm run preview
```

## Struktura katalogów

```
src/
  api/         # klient HTTP (fetch) + funkcje wywołujące endpointy REST
  components/  # współdzielone komponenty UI (Layout, ProtectedRoute, WisdomListItem)
  context/     # AuthContext — przechowywanie tokenu sesji
  pages/       # strony aplikacji (Login, Home, Library, Wisdom Detail/Form, Search, Profile)
  types/       # współdzielone typy TS odzwierciedlające DTO backendu
```

## Główne funkcje

- Logowanie / tworzenie profilu (Profil + PIN)
- Strona główna z losową mądrością dnia
- Biblioteka mądrości (przegląd, tworzenie, edycja, usuwanie własnych wpisów)
- Wyszukiwanie pełnotekstowe i znaczeniowe (semantyczne)
- Zmiana PIN-u

## Lintowanie

```bash
npm run lint
```
