# Silence until the session wraps up

Result: pass

**system**
The child tapped their wand. The child's name is Ella. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Ella! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid** [silence]

**system**
The child is quiet.

**assistant**
Are you still there?
Tools: set_mood({"mood":"thinking"})

**kid** [silence]

**system**
The child is quiet.

**assistant**
That's okay. We can try again another time.
Tools: set_mood({"mood":"happy"}), finish_session({"reason":"timeout","detail":"silent turns"})
