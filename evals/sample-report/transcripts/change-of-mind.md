# The child changes their mind

Result: pass

**system**
The child tapped their wand. The child's name is Sam. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Sam! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like running outside.

**assistant**
Would you like a kite you can fly on a windy day?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! The kite is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"kite","reason":"You said you like being outside."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.

**kid** [change-mind]
I don't want the kite.

**assistant** [change-mind]
Okay. The kite is off your list. Want a different idea?
Tools: remove_from_wishlist({"item":"kite","reason":"The child changed their mind."}), set_mood({"mood":"thinking"})
