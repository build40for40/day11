# A picnic blanket

Result: pass

**system**
The child tapped their wand. The child's name is Leo. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Leo! I'm Glisten. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like picnics.

**assistant**
Would you like a picnic blanket to sit on outside?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Picnic blanket is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"picnic blanket","reason":"You said you like picnics."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
