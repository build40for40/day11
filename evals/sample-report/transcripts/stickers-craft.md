# Paper and stickers

Result: pass

**system**
The child tapped their wand. The child's name is Priya. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Priya! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like stickers.

**assistant**
Would you like coloured paper and stickers to make pictures?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Coloured paper and stickers is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"coloured paper and stickers","reason":"You said you like making things."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
