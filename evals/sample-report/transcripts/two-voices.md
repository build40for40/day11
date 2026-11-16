# Two voices at once

Result: pass

**system**
The child tapped their wand. The child's name is Leo. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Leo! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid** [two-voices]
I want a kite. No, I want a ball.

**system**
Two children are speaking at once. Do not add anything. Ask one child to tap their wand.

**assistant** [two-voices]
I can hear two of you. Please tap one wand.
Tools: set_mood({"mood":"thinking"})
