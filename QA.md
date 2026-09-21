# BMI Calculator — weryfikacja jakości

Data: 21.09.2026. Dane w scenariuszach są przykładowe.

## Testy automatyczne

Polecenie: `node tests/model.test.cjs`. Wynik: **12/12 PASS**.

| Obszar | Sprawdzony warunek |
|---|---|
| Wzór | 180 cm / 72,5 kg → 22,376543… → wyświetlane 22,4 |
| Kategorie | Wartości tuż poniżej oraz dokładnie 18,5 / 25 / 30 |
| Zaokrąglanie | 200 cm / 99,999 kg → wyświetlane 25,0, kategoria nadal poniżej 25 |
| Jednostki | Równoważne dane w cm/kg i in/lb dają ten sam wynik |
| Parser | Przecinek, kropka, białe znaki na końcach |
| Błędne dane | Puste pola, zero, ujemna liczba, tekst, Infinity, notacja wykładnicza, mieszane separatory |
| Błędy pól | Jednoczesne zwrócenie obu błędów i rozróżnienie ich przyczyn |
| Zakresy | Obie dopuszczalne granice i wartości bezpośrednio poza nimi |
| Skala | Ograniczenie pozycji znacznika bez ograniczania wyniku liczbowego |
| Konwersja | Odwracalność przeliczenia oraz nieprawidłowe argumenty |
| Języki | Komplet kluczy i zgodne parametry komunikatów we wszystkich 7 słownikach |
| Integracja treści | Każdy klucz tłumaczenia w HTML ma odpowiednik w słowniku |

## Scenariusze interfejsu wykonane w przeglądarce

| Scenariusz | Zaobserwowany wynik | Status |
|---|---|---|
| Pierwsze wejście | 22,4, widoczne oznaczenie przykładu | PASS |
| Zmiana PL / EN / DE / ES / FR / UK / RU | Zmiana treści, atrybutu lang i formatu liczby | PASS |
| Wprowadzenie 200 / 99,999 i Enter | 25,0, prawidłowa masa ciała; przykład ukryty | PASS |
| Pięć zmian metric → imperial → metric | Zachowane 200 / 99,999 i pierwotna kategoria | PASS |
| Usunięcie wzrostu klawiaturą | Poprzedni wynik ukryty, kopiowanie zablokowane | PASS |
| Obliczenie z pustym wzrostem | Komunikat błędu, fokus na wzroście | PASS |
| Wyczyszczenie obu pól i obliczenie | Dwa błędy wymaganych pól, fokus na pierwszym | PASS |
| Zero i próba zmiany jednostek | Błąd pola i zatrzymanie zmiany jednostek | PASS |
| Imperialne 70 in / 160 lb | Wynik 23,0; jednostki in/lb w podsumowaniu | PASS |
| Przywrócenie przykładu | 180 cm / 72,5 kg, oznaczony wynik 22,4 | PASS |
| Kopiowanie | Komunikat sukcesu i oczekiwany tekst w schowku | PASS |
| Odświeżenie po wyborze DE | Niemiecki pozostał wybrany, pomiary wróciły do przykładu | PASS |
| Rozwinięcie metody obliczeń | Dostępny wzór, przeliczniki i zakresy techniczne | PASS |
| 320 px, wszystkie języki | Brak poziomego przewijania i przepełnień sprawdzonych kontrolek | PASS |
| 320 px, BMI 2000,0 | Cały wynik mieści się w karcie, znacznik na końcu skali | PASS |
| 390 px, francuski | Jednokolumnowy układ i czytelna karta wyniku | PASS |
| 768 px, niemiecki | Dwie kolumny bez poziomego przepełnienia | PASS |
| Komputer, polski | Pełna strona oceniona wizualnie | PASS |
| Konsola przeglądarki po scenariuszach | Brak zgłoszonych błędów JavaScript | PASS |

## Dalsza weryfikacja przed publikacją

Poniższe punkty nie zostały oznaczone jako wykonane: rzeczywiste Safari/iOS i Firefox, czytnik ekranu NVDA/VoiceOver, powiększenie 200%, ręczna ocena kontrastów, dostępność schowka na docelowej domenie HTTPS oraz działanie po wgraniu do konkretnego podkatalogu hostingu.
