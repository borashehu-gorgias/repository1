# AI Agent Evaluation Feature

This feature allows you to test and evaluate your AI agent's performance by creating test tickets based on past FAQ tickets with good customer satisfaction (CSAT) scores.

## Overview

The AI Evaluation feature helps you:

1. **Pull high-quality FAQ tickets** - Automatically fetch past FAQ tickets with good CSAT scores (4/5 or 5/5)
2. **Create test tickets** - Generate new tickets assigned to your AI agent using the customer questions from the source tickets
3. **Monitor AI responses** - View and compare AI agent responses with the original human responses
4. **Track evaluation** - All test tickets are tagged with `ai-agent-test` and `ai-evaluation` for easy filtering and analysis

## How to Use

### 1. Access the AI Evaluation Page

Navigate to **Dashboard > AI Evaluation** in the application.

### 2. Review Source FAQ Tickets

The application will automatically fetch 10 past FAQ tickets with good CSAT scores. These tickets:
- Are closed tickets
- Have CSAT scores of 4 or 5 (out of 5)
- Include FAQ-related tags or questions
- Contain both customer questions and human responses

You can:
- View ticket details including subject, customer info, status, and CSAT score
- Expand tickets to see the full message thread
- Select specific tickets to use for testing

### 3. Create Test Tickets

1. **Select tickets** - Use the checkboxes to select which FAQ tickets you want to use for testing
   - Click "Select All" to select all tickets
   - Click individual checkboxes to select specific tickets

2. **Create test tickets** - Click the "Create Test Ticket(s)" button
   - The system will create new tickets using the customer questions from the selected source tickets
   - Test tickets are automatically tagged with:
     - `ai-agent-test`
     - `ai-evaluation`
   - The AI agent will be assigned to respond to these tickets

3. **Wait for AI responses** - The AI agent will process the test tickets and generate responses

### 4. View and Analyze Results

Switch to the **AI Test Tickets** tab to:
- View all test tickets that have been created
- See the AI agent's responses
- Compare AI responses with the original human responses from the source tickets
- Evaluate response quality and accuracy

## API Endpoints

### Fetch FAQ Tickets

```
GET /api/faq-tickets?limit=10
```

Returns FAQ tickets with good CSAT scores, including messages.

**Response:**
```json
{
  "success": true,
  "tickets": [...],
  "count": 10
}
```

### Create Test Tickets

```
POST /api/ai-test-tickets
```

**Request Body:**
```json
{
  "sourceTickets": [
    {
      "id": 123,
      "subject": "How do I reset my password?",
      "messages": [...],
      "customer": {...}
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "created": 5,
  "tickets": [...],
  "aiAgent": {
    "id": 456,
    "name": "AI Agent"
  }
}
```

### Get Test Tickets

```
GET /api/ai-test-tickets
```

Returns all test tickets tagged with `ai-agent-test`.

## Technical Details

### CSAT Filtering

The system filters tickets based on:
- `satisfaction_score >= 4` (primary field)
- `meta.satisfaction_rating >= 4` (fallback field)

If not enough FAQ-tagged tickets are found, the system will include other tickets with good CSAT scores.

### Ticket Creation

Test tickets are created with:
- **Subject**: Prefixed with "AI Test: " for easy identification
- **Messages**: Customer's original question
- **Tags**: `ai-agent-test` and `ai-evaluation`
- **Customer**: Same customer information as the source ticket
- **Channel**: Email (via API)

### AI Agent Assignment

The system automatically:
1. Fetches your AI agent integration
2. Tags test tickets with the AI agent identifier
3. Routes tickets to the AI agent for response

### Viewing in Gorgias

You can view all test tickets in your Gorgias dashboard by:
1. Creating a view with the filter: `tags contains ai-agent-test`
2. Or searching for tickets with the `ai-evaluation` tag

## Components

### Backend (API Routes)

- `/app/api/faq-tickets/route.ts` - Fetches FAQ tickets with good CSAT
- `/app/api/ai-test-tickets/route.ts` - Creates and retrieves test tickets

### Frontend (UI Components)

- `/app/(authenticated)/dashboard/ai-evaluation/page.tsx` - Main evaluation page
- `/components/ai-evaluation/AITicketsList.tsx` - Ticket display component

### Core Library

- `/lib/core/api-client.ts` - Extended with methods:
  - `getFAQTicketsWithGoodCSAT()` - Fetch FAQ tickets
  - `createTicket()` - Create new tickets
  - `addTagsToTicket()` - Add tags to tickets
  - `getAIAgentIntegration()` - Get AI agent details

## Best Practices

1. **Start small** - Begin with 5-10 test tickets to evaluate AI performance
2. **Review regularly** - Check AI responses periodically to ensure quality
3. **Compare responses** - Use the expanded view to compare AI vs. human responses
4. **Track metrics** - Monitor which types of questions the AI handles well
5. **Iterate** - Use insights to improve AI agent training and guidances

## Troubleshooting

### No FAQ tickets found

- Ensure you have closed tickets with CSAT scores in your Gorgias account
- Check that tickets have satisfaction ratings recorded
- Try fetching more tickets by adjusting the limit parameter

### AI agent not responding

- Verify AI agent integration is properly configured in Gorgias
- Check that tickets are properly tagged and routed
- Review AI agent settings and ensure it's enabled

### Test tickets not appearing

- Refresh the test tickets tab
- Check Gorgias dashboard for tickets with `ai-agent-test` tag
- Verify API authentication is working correctly

## Future Enhancements

Potential improvements for this feature:

- Automatic comparison scoring between AI and human responses
- Response quality metrics and analytics
- Bulk evaluation reports
- A/B testing between different AI configurations
- Integration with feedback loops for AI training
