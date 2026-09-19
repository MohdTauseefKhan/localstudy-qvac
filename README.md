# LocalStudy

LocalStudy is a private desktop AI study assistant powered by Tether's QVAC SDK.

It runs AI inference locally on the user's device, allowing students to ask questions and receive answers without sending their study questions to a cloud AI service.

## Features

- Local AI inference using QVAC
- Private, on-device processing
- Conversational follow-up questions
- Streaming AI responses
- Markdown and code formatting
- Desktop application built with Electron
- Designed for studying programming, computer science, mathematics, and other subjects
- Responsive dark-themed interface

## Tech Stack

- Electron
- React
- TypeScript
- Tailwind CSS
- Tether QVAC SDK
- Vite
- React Markdown

## QVAC SDK

This project uses:

@qvac/sdk@0.19.1

The application uses QVAC's local model loading and completion APIs:

- loadModel
- completion
- unloadModel

The application uses the local model:

LLAMA_3_2_1B_INST_Q4_0

## Requirements

Before running the project, make sure you have:

- Node.js installed
- npm installed
- Git installed
- A Windows, macOS, or Linux system capable of running Electron

## Installation

Clone the repository:

git clone https://github.com/MohdTauseefKhan/localstudy-qvac.git

Go into the project directory:

cd localstudy-qvac

Install dependencies:

npm install

## Run the Application

Start the development application:

npm run dev

The Electron desktop application will open.

The first model load may take longer because the QVAC model needs to be prepared locally.

## How It Works

The application has three main layers.

### 1. React Renderer

The React interface allows the student to:

- Enter questions
- View conversation history
- Receive streamed responses
- View formatted Markdown and code

### 2. Electron IPC

Electron provides communication between the React renderer and the application's main process.

The renderer sends the conversation to the Electron main process through IPC.

### 3. QVAC Local AI

The Electron main process loads the QVAC model and performs inference locally.

The generated tokens are streamed back to the React interface through Electron IPC.

No external cloud AI API is required for generating answers.

## Privacy

LocalStudy is designed around local inference.

Student questions are processed by the QVAC model running on the user's device rather than being sent to a cloud AI provider.

## Project Structure

localstudy-qvac/
├── src/
│ ├── main/
│ │ └── index.ts
│ ├── preload/
│ │ ├── index.ts
│ │ └── index.d.ts
│ └── renderer/
│ └── src/
│ ├── App.tsx
│ ├── main.tsx
│ └── assets/
├── package.json
├── README.md
└── ...

## License

This project is open source under the MIT License.

See LICENSE for details.
