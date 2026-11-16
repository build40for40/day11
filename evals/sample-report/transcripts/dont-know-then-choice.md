# Two I don't knows, then a short choice

Result: pass

**system**
The child tapped their wand. The child's name is Ella. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Ella! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I don't know.

**assistant**
That's okay. Do you like making things, or running around outside more?
Tools: set_mood({"mood":"thinking"})

**kid**
I don't know.

**assistant**
A wooden puzzle or a soft ball?
Tools: set_mood({"mood":"thinking"})

**kid**
The ball.

**assistant**
Would you like a soft ball to roll and throw?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Soft ball is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"soft ball","reason":"You said you like balls."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
