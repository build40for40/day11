# Silence until the session wraps up

Result: pass

**system**
The child tapped their wand. The child's name is Ella. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Ella! I'm Glisten. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid** [silence]

**system**
The child is quiet.

**assistant**
Are you still there?
Tools: set_mood({"mood":"thinking"})

**kid** [silence]

**system**
The child has gone quiet again. Say a short happy goodbye with a recap of the list and call finish_session("silence").

**assistant**
That's okay. We can do it another day.
Tools: set_mood({"mood":"happy"}), finish_session({"reason":"silence","detail":"silent turns"})
