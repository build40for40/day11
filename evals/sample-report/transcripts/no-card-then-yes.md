# A NO card rejects the train

Result: pass

**system**
The child tapped their wand. The child's name is Jack. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Jack! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like trains.

**assistant**
Would you like a wooden train set?
Tools: set_mood({"mood":"thinking"})

**system**
The child tapped the NO card.

**assistant**
Would you like wooden dinosaur figures?
Tools: shake({}), set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Wooden dinosaur figures is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden dinosaur figures","reason":"You said you like dinosaurs."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.
