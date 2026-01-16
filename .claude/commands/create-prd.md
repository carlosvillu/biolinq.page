---
allowed-tools: AskUserQuestion, Write
argument-hint: <spec-content>
description: Create a PRD.md by interviewing the user about their spec
---

## Spec Content

$ARGUMENTS

## Instructions

Based on the spec content above, conduct an in-depth interview with the user using the AskUserQuestion tool. Ask about:

- Technical implementation details and decisions
- UI & UX considerations and preferences
- Concerns and potential risks
- Tradeoffs between different approaches
- Edge cases and error handling
- Performance and scalability considerations
- Security implications
- Integration points and dependencies
- User flows and journeys
- Data models and state management
- Testing strategies
- Deployment and rollout considerations

**Important interview rules:**

- Ask NON-OBVIOUS questions - avoid questions that are already answered in the spec
- Be thorough and continue interviewing until you have a complete picture
- Ask follow-up questions based on user responses
- Explore areas where the spec is vague or incomplete
- Challenge assumptions and explore alternatives
- Ask as many questions as needed - this is a critical phase, do not limit yourself

Continue the interview process iteratively until:

- All major areas have been covered
- The user indicates they're satisfied with the depth
- You have enough information to write a comprehensive PRD

Once the interview is complete, write the PRD to `PRD.md` in the project root with:

- Executive summary
- Problem statement
- Goals and success metrics
- User stories and requirements
- Technical architecture decisions
- UI/UX specifications
- Data models
- API specifications (if applicable)
- Security considerations
- Testing strategy
- Risks and mitigations
- Timeline and milestones (if discussed)
- Open questions (if any remain)

**Start the interview now.**
