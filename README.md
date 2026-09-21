# BMI Calculator

Samodzielny projekt do portfolio Nikity Rysieva. Interfejs w bieli, granacie i lawendzie, dopasowany do karty BMI Calculator. Czysty HTML, CSS i JavaScript — bez frameworka, instalacji pakietów, zewnętrznych fontów i procesu budowania.

## Uruchomienie

Rozpakuj ZIP i otwórz `bmi-calculator/index.html` w przeglądarce. Do lokalnego podglądu przez HTTP możesz też użyć Pythona, uruchamiając w folderze projektu:

```sh
python -m http.server 8770
```

Następnie otwórz `http://localhost:8770`. Kopiowanie wyniku korzysta z systemowego schowka i działa w bezpiecznym kontekście HTTPS lub localhost. Jeżeli przeglądarka blokuje schowek, aplikacja wyświetla komunikat z możliwością ręcznego skopiowania tekstu.

## Podłączenie do portfolio

Przenieś cały folder `bmi-calculator` do katalogu `projects` na swoim hostingu. W przycisku „Otwórz aplikację” możesz użyć:

```html
<a href="./projects/bmi-calculator/" target="_blank" rel="noopener noreferrer">
  Otwórz aplikację ↗
</a>
```

Wszystkie zasoby mają względne ścieżki, więc projekt działa również w podkatalogu. Nie wymaga zmian w głównej stronie. W produkcji użyj HTTPS. Pliki dokumentacji i folder `tests` możesz pozostawić w repozytorium; do działania aplikacji wystarczy sześć plików wymienionych niżej.

## Struktura

```text
bmi-calculator/
├── index.html          struktura i semantyka
├── styles.css          wygląd, stany i responsywność
├── app.js              interakcje, formularz i zmiana języka
├── model.js            obliczenia, konwersja i walidacja
├── translations.js     PL / EN / DE / ES / FR / UK / RU
├── favicon.svg         znak aplikacji
├── README.md
├── QA.md               scenariusze i zakres weryfikacji
└── tests/
    └── model.test.cjs   testy bez zewnętrznych zależności
```

## Funkcje

- Obliczanie BMI oraz prezentacja kategorii, pomiarów i wyniku z trzema miejscami po przecinku.
- Jednostki metryczne (cm/kg) i imperialne (cale/funty), konwersja z zachowaniem dokładnych wartości w pamięci.
- Siedem języków, lokalny format liczb i zapamiętywanie wyłącznie wybranego języka.
- Walidacja pustych pól, zer, niepoprawnych liczb i zakresów; obsługa kropki lub przecinka dziesiętnego.
- Zmiana pomiaru od razu ukrywa poprzedni wynik, aby nie przedstawiać nieaktualnego obliczenia.
- Czyszczenie formularza, przykładowe dane, kopiowanie wyniku i rozwijane wyjaśnienie wzoru.
- Widoki telefonu, tabletu i komputera, obsługa klawiatury, etykiety pól, komunikaty dla czytników ekranu oraz respektowanie ograniczenia animacji.

## Zasady obliczeń

`BMI = masa [kg] / wzrost [m]²`. Dokładne przeliczniki: `1 in = 2,54 cm`, `1 lb = 0,45359237 kg`.

Kategorie dla dorosłych od 20. roku życia: poniżej 18,5; od 18,5 do poniżej 25; od 25 do poniżej 30; od 30. Klasyfikacja wykorzystuje wynik **przed zaokrągleniem**. Duża liczba ma jedno miejsce po przecinku, dodatkowa wartość trzy. Przy granicy kategorii obie wartości mogą wizualnie zaokrąglić się do progu — wyjaśnia to notatka przy wyniku.

Źródło: [CDC — Adult BMI Categories](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html). BMI jest wskaźnikiem przesiewowym, nie diagnozą. Aplikacja nie służy do oceny dzieci ani masy ciała w ciąży i nie generuje zaleceń leczenia.

Zakresy techniczne formularza to 50–260 cm i 10–500 kg; nie są to zakresy zalecanej masy ciała. Model dopuszcza tolerancję `0,000001` przy porównywaniu limitów, aby uniknąć błędów zmiennoprzecinkowych konwersji. Skala wizualna obejmuje BMI 12–40; dla wartości poza nią znacznik zostaje na odpowiednim końcu, a wynik liczbowy pozostaje pełny.

## Prywatność

Pomiary są przetwarzane wyłącznie w pamięci przeglądarki. Nie ma backendu, analityki, wysyłania formularza ani zapisu pomiarów. Odświeżenie przywraca jawnie oznaczony przykład 180 cm / 72,5 kg. `localStorage` zawiera tylko preferencję języka pod kluczem `nr-bmi-language`. Kliknięcie przycisku kopiowania zapisuje wynik w schowku użytkownika.

## Testy

Wymagany Node.js 18 lub nowszy. W katalogu projektu:

```sh
node tests/model.test.cjs
```

Wynik przygotowanej wersji: **12 testów zaliczonych**. Scenariusze interfejsu i zakres sprawdzenia opisuje `QA.md`.

Projekt korzysta z funkcji współczesnych przeglądarek, m.in. `Intl.NumberFormat`, CSS Grid i `Object.hasOwn`. Weryfikację interfejsu wykonano w przeglądarce wbudowanej w Codex; testy na rzeczywistym Safari/iOS, Firefox i Androidzie pozostają do wykonania przed publikacją na docelowym hostingu.
