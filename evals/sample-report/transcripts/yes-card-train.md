# A YES card confirms the train

Result: pass

**system**
The child tapped their wand. The child's name is Jack. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Jack! I'm Glisten. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like trains.

**assistant**
Would you like a wooden train set?
Tools: set_mood({"mood":"thinking"})

**system**
The child tapped the YES card.

**assistant**
Yes! Wooden train set is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden train set","reason":"You said you like trains."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
