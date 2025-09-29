# Riddle Generation Scripts

This document provides instructions for generating large batches of riddles, emoji puzzles, and word lists for the Burble application using the Perplexity API.

## Prerequisites

1. You need a valid Perplexity API key set in your environment variables:
   ```
   export PERPLEXITY_API_KEY=your_api_key_here
   ```

2. Make sure your database connection is properly configured with the `DATABASE_URL` environment variable.

## Available Scripts

The following scripts are available to generate content:

### 1. Generate Standard Riddles

This script generates 200 unique riddles for each of the standard categories (Logic Puzzles, Word Riddles, Math Puzzles, Visual Puzzles, Lateral Thinking, and EV Special).

```bash
NODE_ENV=development npx tsx scripts/generate-riddles.ts
```

### 2. Generate Emoji Puzzles

This script generates 200 emoji puzzles for each emoji category (Movies, TV Shows, Foods, Household Items, and Places).

```bash
NODE_ENV=development npx tsx scripts/generate-emoji-puzzles.ts
```

### 3. Generate Burble Word Lists

This script generates 200 words for each word length category (4, 5, 6, 7, and 8 letter words) for the Burble game.

```bash
NODE_ENV=development npx tsx scripts/generate-burble-words.ts
```

### 4. Generate All Content

This script runs all the above generators in sequence to avoid overwhelming the API or database:

```bash
NODE_ENV=development npx tsx scripts/generate-all-content.ts
```

### 5. Clean Duplicate Riddles

After generating content, you can run this script to identify and remove any duplicate riddles:

```bash
NODE_ENV=development npx tsx scripts/clean-duplicate-riddles.ts
```

## Notes on Content Generation

- The scripts use the Perplexity API which may have rate limits, so the generation process includes delays.
- Generation is designed to avoid duplicates within each category.
- Each script creates categories as needed if they don't already exist.
- For large databases, the scripts may take considerable time to complete.
- All generated content is stored directly in the database and will be available immediately to users.

## Best Practices

1. Run these scripts during off-peak hours to minimize impact on app performance.
2. Always back up your database before running large generation scripts.
3. Use `clean-duplicate-riddles.ts` after generation to ensure data quality.
4. Monitor the API usage to avoid exceeding rate limits.

## API Considerations

The Perplexity API may have usage limits. If you encounter rate limit errors, you may need to:

1. Reduce batch sizes in the scripts
2. Increase the delay between API calls
3. Split the generation across multiple days

## Content Quality

The generated content is designed to be:
- Age-appropriate for all users
- Free of inappropriate content
- Varied in difficulty levels
- Educational and entertaining
- Unique (with efforts to avoid duplicates)