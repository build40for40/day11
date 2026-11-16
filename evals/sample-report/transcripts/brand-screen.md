# iPad and Lego get a gentle redirect

Result: pass

**system**
The child tapped their wand. The child's name is Jack. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Jack! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid** [brand]
I want an iPad and a Lego set.

**assistant** [brand]
I won't put that on the list. Would you like wooden building blocks?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden building blocks is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden building blocks","reason":"You said you like blocks."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
