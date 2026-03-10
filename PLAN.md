# Vietnam New Wards Guide Web Extension

## Background:

Before June 2025, Vietnam administrative hierachy has three levels which are simply put: provinces > districts > wards or communes.

But since June 2025, pursuant to the constitution, there are now only two levels of administrative divisions in Vietnam: provinces and communes:

- Provincial level: autonomous municipality (thành phố trực thuộc trung ương, literally city subordinate to central authority) and province (tỉnh)
- Commune level: ward (phường) in major urban areas, commune (xã) for rural areas, and special zone (đặc khu) for considerable island formations.

The restructure of Vietnam administrative divisions is major, but not radical. Here are hightlights of the movements:

- Provinces were 63 now are down to 34 by merging old adjacent provinces and their geolocation boundaries together with one of the old province name remain.
- District divisions were removed
- For wards and communes, new larger ones are merged from 2 to 3 old adjacent wards. New wards often has new names and it's very often that no old names remain in the new wards, especially ones with numeric names.

So, during the transition to the new admin division system, people are often confused about the migration from old address to new one or confused about the whereabout of new wards mentioned in newspaper and document as they cannot relate new one to the old district and ward names.

So, here the web extension I'm building to ease the transition as well as a guide for users getting accustomed to new wards system:

## Feature Roadmap overview

1. [x] Look up new wards from old three level divisions
2. [x] Look up old wards / district from new two level divisions
3. [x] Annotate new ward instances in site content with old district

## Non-function tasks

- [ ] Create the extension logos
- [ ] Update manifest
- [ ] Prepare screenshot
- [ ] Write up about tab
- [ ] Implement settings?
- [ ] Create project landing page, with workable lookup tabs
- [ ] i18n? Do we need English?
- [ ] Upload to chrome web store and firefox extension marketplace

## Feature specification

### Overall UI

- Popup UI:
    - Two tabs for two look up features
    - Another tab for Options UI: two sections for lookup and annotation features

### Look up new to old wards

Purpose: look up old ward and district from new wards

How it works:

There are 2 searchable select input:
- "Tỉnh / thành mới" select: searchable by name index
- "Phường xã mới" select:
  - Searchable by name index
  - If no province selected, list all wards that match user input (with accompanied province name)

Once a ward is selected:
- Display old ward info: all old wards, old district and old province
- Allow user to copy each line of ward, district, province to clipboard


### Look up old to new wards

Purpose: look up new wards from old wards, district and province

How it works:

There are 3 searchable select inputs:
- "Tỉnh / thành cũ" select: searchable by name index.
- "Quận / huyện cũ" select: searchable by name index. Disabled until province is selected
- "Phường / xã cũ" select: searchable by name index. Disabled until district field is selected

Once a ward is selected:
- Display new ward info: new ward, and new province
- Allow user to copy each line of ward, province to clipboard

### Annotate new wards with old wards in page content

- The extension scans the page content for new ward names using a regex pattern that captures `phường|xã|thị trấn` followed by up to 6 word tokens.
- When a new ward name is found, it adds a dotted underline and `[?]` hint icon.
- On hover, a tooltip displays the old district(s) and province(s) that the new ward was formed from.
- **Fallback matching**: The regex may over-capture trailing words (e.g., "phường Yên Hòa tối 6/3"). The lookup retries with progressively shorter names until a match is found, then annotates only the matched portion.
- Province hints in parentheses (e.g., "phường Bảy Hiền (TP.HCM)") help disambiguate wards with the same name across provinces.
- Skips annotation inside `<script>`, `<style>`, `<a>`, `<button>`, and other non-content elements.
