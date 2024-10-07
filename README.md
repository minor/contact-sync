# Contact Sync

Ever been added to a groupchat with no one's numbers added? And then, they just all send their names spamming the groupchat with so many messages and you have to manually add the contacts one-by-one?

No longer! Contact Sync is a simple app that creates a file to add multiple contacts from manual entry, spreadsheet, or even a screenshot (uses Gemini). **Note**: Currently only tested on MacOS (not sure if it's possible to add multiple contacts at once on iPhone).

## Tech Stack

- **Framework**: Next.js
- **Styling**: Tailwind CSS
- **APIs**: Gemini, AI SDK

## How it works

The application allows users to add contacts individually, process spreadsheets, and even extract contact information from images. It validates phone numbers and formats them for consistency.

## Running Locally

### Installing dependencies

```console
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

## Running the application

Then, run the application in the terminal and it will be available at [http://localhost:3000](http://localhost:3000).

```console
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
