# A wooden train card is offered, then accepted

Result: pass

**system**
The child tapped their wand. The child's name is Benji. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Benji! I'm Glisten. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
The child tapped a card: "wooden train set".

**assistant**
Would you like a wooden train set?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden train set is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden train set","reason":"You said you like trains."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
