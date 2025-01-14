# Pigeon - LinkedIn Networking Assistant

A Chrome extension that helps you draft personalized messages for job networking on LinkedIn. Using AI, it generates contextual messages for referral requests and meeting invitations based on your resume and the job posting.

## Features

- Resume-based message personalization
- OpenAI GPT integration for message generation
- Automatic detection of hiring managers on LinkedIn
- Two message types:
  - Referral request (with job position link)
  - Meeting/call request
- Side panel interface for easy access
- Message editing and regeneration capabilities

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/pigeon.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the pigeon directory

## Setup

1. Click the Pigeon extension icon in your Chrome toolbar
2. Upload your resume (PDF format)
3. Enter your OpenAI API key
4. Start browsing LinkedIn!

## Usage

1. When you find a hiring manager's profile on LinkedIn:
   - The extension will automatically detect hiring-related keywords
   - Click the Pigeon icon to open the side panel

2. Choose your message type:
   - **Ask for Referral**: Enter the job posting URL and get a personalized referral request
   - **Request Meeting**: Get a message requesting a brief zoom call

3. Review and edit the generated message
   - Use the "Regenerate" button for a new version
   - Click "Copy to Clipboard" to paste into LinkedIn

## Development

### Project Structure
```
pigeon/
├── manifest.json        # Extension configuration
├── sidepanel.html      # Main UI
├── styles.css          # Styling
├── sidepanel.js        # UI logic and OpenAI integration
└── content.js          # LinkedIn page analysis
```

### Local Development

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Pigeon extension card
4. Test your changes

### Getting Started with Development

1. **Set Up Development Environment**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/pigeon.git
   
   # Install dependencies
   npm install
   
   # Set up development tools
   npm install --save-dev prettier eslint jest
   ```

2. **Making Changes**
   - Follow the [Contributing Guidelines](CONTRIBUTING.md)
   - Use consistent code formatting
   - Add tests for new features
   - Update documentation

3. **Testing Changes**
   ```bash
   # Run linting
   npm run lint
   
   # Run tests
   npm test
   
   # Build extension
   npm run build
   ```

4. **Submitting Changes**
   - Create feature branches
   - Write clear commit messages
   - Submit pull requests
   - Participate in code reviews

## Security Notes

- Your OpenAI API key is stored locally in Chrome storage
- Resume content is stored locally and only used for message generation
- No data is sent to external servers except OpenAI API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.