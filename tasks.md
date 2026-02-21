# AI Food - Task List

---

## 1. Meals Page (Read-Only Library)

- [ ] Remove the ability to manually create meals from the `/meals` page
- [ ] Remove any "Add Meal" buttons or forms from the meals UI
- [ ] Convert the meals page into a read-only library view
- [ ] Display all user meals with name, description, cuisine, servings, and ingredients
- [ ] Add a search/filter bar so users can browse their meal library
- [ ] Add a macro summary (calories, protein, carbs, fat) to each meal card
- [ ] Ensure users understand meals are created through the AI chat (add helper text or empty state message)

---

## 2. AI Meal Suggestions

- [ ] Create a new `suggest-meal` tool in `/app/api/chat/route.ts`
- [ ] Create the tool handler at `/app/api/tools/suggest-meal/route.ts`
- [ ] Tool should query the user's current inventory to suggest meals based on available ingredients
- [ ] Tool should reference meal history to avoid repeating recent meals
- [ ] Tool should support user preference context (cuisine type, dietary restrictions, etc.)
- [ ] AI should be able to suggest a single meal or a full week of meals
- [ ] Suggested meals should be addable to the meal plan directly from the chat
- [ ] Update the system prompt to inform Claude it can suggest meals

---

## 3. Enhanced Grocery List (AI-Driven)

- [ ] Update the `ShoppingListItem` model to support custom categories (produce, dairy, snacks, household, toiletries, etc.)
- [ ] Remove any UI that allows manual item addition - all list management goes through AI
- [ ] Create an `add-to-shopping-list` tool so Claude can add any item (not just meal ingredients)
- [ ] Create a `remove-from-shopping-list` tool so Claude can remove items
- [ ] Create a `clear-shopping-list` tool for clearing completed or all items
- [ ] Update the `/shopping-list` page to display items grouped by category
- [ ] Add the ability to check off items as purchased (UI only)
- [ ] Update the system prompt so Claude knows it can manage the full shopping list

---

## 4. Macros

- [ ] Add `instructions`, `calories`, `protein`, `carbs`, and `fat` fields to the `Meal` model in Prisma schema
- [ ] Run database migration after schema update
- [ ] Update the `create-meal` tool to auto-generate macros and instructions via Claude when a meal is created
- [ ] Display macros on the meals library page
- [ ] Display macros on the cooking mode (dinner UI) page
- [ ] Display macros in the meal planner view

---

## 5. Cooking Mode (Dinner UI)

- [ ] Create a cooking mode page at `/meals/[id]/cook`
- [ ] Page should display the meal name, description, prep time, and servings
- [ ] Show a clear ingredients list with quantities and units
- [ ] Show step-by-step cooking instructions
- [ ] Show macro breakdown (calories, protein, carbs, fat)
- [ ] Add a "Mark as Cooked" button that logs to `MealHistory`
- [ ] Make the page mobile-friendly for use in the kitchen
- [ ] Add a link to cooking mode from the planner when a meal is planned for today

---

## 6. New User Onboarding

- [ ] After registration, redirect new users to `/onboarding` instead of home
- [ ] Step 1 - Preferences: Collect dietary restrictions, cuisine preferences, and number of people cooking for
- [ ] Step 2 - Inventory: Allow user to input their current pantry/fridge inventory or skip to start fresh
- [ ] Store preferences in a new `UserPreferences` model in the database
- [ ] Update the AI system prompt to include user preferences as context
- [ ] Add a way for users to update their preferences later (settings/profile page)
- [ ] Ensure returning users are not redirected to onboarding again

---

## 7. Security

### Authentication & Authorization
- [ ] Add rate limiting to the `/api/auth/register` endpoint to prevent abuse
- [ ] Add rate limiting to the `/api/chat` endpoint to prevent API cost abuse
- [ ] Add brute force protection to the sign-in endpoint (lock after N failed attempts)
- [ ] Enforce strong password requirements on registration (uppercase, number, special character)
- [ ] Ensure every API route verifies an authenticated session before processing

### Input Validation & Sanitization
- [ ] Validate and sanitize all user inputs on every API route
- [ ] Add max length checks on all string inputs
- [ ] Ensure no raw user input is passed directly to database queries

### Secure Headers & Configuration
- [ ] Add security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.) via Next.js config
- [ ] Validate all required environment variables at startup
- [ ] Move any hardcoded values (token limits, salt rounds, etc.) to environment variables

### Session Security
- [ ] Set secure cookie settings for JWT sessions (httpOnly, secure, sameSite)
- [ ] Add session expiry and enforce re-authentication after inactivity
- [ ] Ensure sign-out fully clears the session and JWT cookie

---

## 8. AI Model Flexibility (Cerebras)

- [ ] Install Cerebras SDK or configure OpenAI SDK with Cerebras base URL (`https://api.cerebras.ai/v1`)
- [ ] Add `CEREBRAS_API_KEY` to environment variables
- [ ] Rewrite tool definitions from Anthropic format (`input_schema`) to OpenAI format (`function.parameters`)
- [ ] Update tool detection logic from `stop_reason === "tool_use"` to `finish_reason === "tool_calls"`
- [ ] Update tool result handling to use OpenAI format (`role: "tool"`, `tool_call_id`)
- [ ] Update response parsing from `response.content[]` to `response.choices[0].message`
- [ ] Update the summarization function to use Cerebras instead of Anthropic
- [ ] Test all tools (add meal, create meal, remove meal) with Cerebras model
- [ ] Compare response quality and speed between Anthropic and Cerebras
- [ ] Consider adding an environment variable (`AI_PROVIDER`) to switch between providers without code changes

---

## 9. Shopping List Weekly Navigation

- [X] Link each `ShoppingList` to a specific week start date (similar to `MealPlan`)
- [X] Update the `/shopping-list` page to display the current week's list by default
- [X] Add previous and next week arrow buttons to navigate between weeks
- [X] Show the week date range (e.g. "Feb 16 - Feb 22") as a header like the planner
- [X] Auto-create a new shopping list for the current week if one doesn't exist
- [X] Preserve past shopping lists so users can look back at previous weeks
- [ ] Give the user the ability to add an item to the shopping list that is not meal specific
- [ ] 
- [ ] Update the AI tools (`add-to-shopping-list`, `remove-from-shopping-list`) to always write to the current week's list

---

## Future Considerations (Not Yet Prioritized)

- [ ] Password reset / forgot password flow
- [ ] Email verification for new accounts
- [ ] Mobile responsive design audit
- [ ] Export shopping list (PDF or share link)
- [ ] Multiple shopping lists support
- [ ] Nutritional goal tracking (daily calorie targets, macro goals)
