# Chrome Web Store Submission Checklist

This document provides a comprehensive checklist to ensure your Burble Chrome Extension is ready for Chrome Web Store submission. Use this checklist to verify that all required elements are prepared and properly formatted.

## Required Files

### Extension Files
- [ ] `manifest.json` - Complete and valid
- [ ] HTML files (`popup.html`, `valentine.html`, `emoji.html`, etc.)
- [ ] JavaScript files (`popup.js`, `valentine.js`, `emoji.js`, `api.js`, etc.)
- [ ] CSS files (`styles.css`)
- [ ] PNG icons in required sizes (16x16, 48x48, 128x128)

### Store Assets
- [ ] Screenshots (at least 1, up to 5)
- [ ] Small promotional tile (440x280)
- [ ] Large promotional tile (optional, 920x680)
- [ ] Store description (short and detailed)
- [ ] Privacy policy

## Manifest.json Verification

- [ ] Valid manifest version (v3 recommended)
- [ ] Proper name and description
- [ ] All required permissions are listed and justified
- [ ] Icons specified correctly
- [ ] Action (browser_action or page_action) properly configured
- [ ] Content security policy if needed
- [ ] Background scripts properly defined
- [ ] Web accessible resources listed if needed

## Technical Requirements

- [ ] Extension loads without errors
- [ ] All features work as expected
- [ ] User data is properly stored
- [ ] Offline functionality works
- [ ] Error handling is implemented
- [ ] Performance is optimized (no memory leaks or excessive CPU usage)
- [ ] Cross-browser compatibility (if targeting multiple browsers)

## Chrome Web Store Requirements

### Metadata
- [ ] Extension name (max 45 characters)
- [ ] Short description (max 132 characters)
- [ ] Detailed description (max 16,000 characters)
- [ ] Primary category selected (Games, Education, or Productivity recommended)
- [ ] Secondary category selected (optional)
- [ ] Language specified
- [ ] Developer website URL
- [ ] Developer email address

### Visual Assets
- [ ] Icon (128x128 PNG)
- [ ] At least one screenshot (1280×800 or 640×400)
- [ ] Small promotional tile (440×280)
- [ ] Large promotional tile (optional, 920×680)
- [ ] Marquee promotional tile (optional, 1400×560)

### Content Policies
- [ ] No intellectual property violations
- [ ] No deceptive behaviors
- [ ] Clear privacy disclosures
- [ ] Appropriate content for all users
- [ ] No excessive permissions
- [ ] No cryptocurrency mining
- [ ] No prohibited products (gambling, weapons, etc.)

### Privacy Requirements
- [ ] Privacy policy URL provided
- [ ] Data collection practices disclosed
- [ ] User data handling explained
- [ ] Third-party sharing policies outlined
- [ ] User rights and choices documented

## Developer Account Requirements

- [ ] Google developer account created
- [ ] One-time registration fee paid ($5 USD)
- [ ] Developer contact information provided
- [ ] Tax and payment information configured (if applicable)

## Packaging

- [ ] All unnecessary files removed (development files, READMEs, etc.)
- [ ] ZIP package created with extension files
- [ ] ZIP file size less than 10MB

## Pre-submission Testing

- [ ] Tested in Chrome stable
- [ ] Tested in Chrome beta (recommended)
- [ ] Tested in incognito mode
- [ ] Tested with various screen sizes
- [ ] Tested error conditions and recovery

## Submission Process

1. Sign in to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Click "New Item" button
3. Upload ZIP package
4. Fill in all required store listing information
5. Set up pricing and distribution
6. Verify and submit for review

## Post-Submission

- [ ] Monitor developer dashboard for review status
- [ ] Be prepared to make changes if requested by the review team
- [ ] Plan post-launch monitoring and updates
- [ ] Prepare support channel for user questions

## Notes and Tips

- The review process typically takes 1-5 business days
- Extensions with many permissions may face additional scrutiny
- Keep documentation of permission usage for review team questions
- Ensure your privacy policy is comprehensive and accessible
- Test thoroughly before submission to avoid rejection and resubmission

## Useful Resources

- [Chrome Developer Program Policies](https://developer.chrome.com/docs/webstore/program_policies/)
- [Chrome Web Store Publishing Guidelines](https://developer.chrome.com/docs/webstore/publish/)
- [Chrome Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/best_practices/)
- [Chrome Extension Quality Guidelines](https://developer.chrome.com/docs/extensions/mv3/quality_guidelines/)