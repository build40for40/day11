# Background speech is not a request

Result: pass

**system**
The child tapped their wand. The child's name is Omar. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Omar! I'm Glisten. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid** [background]
Mum, can I have a biscuit?

**system**
That speech was not directed at you. Do not treat it as a request.

**assistant** [background]
I'll wait until you talk to me.
Tools: set_mood({"mood":"listening"})
