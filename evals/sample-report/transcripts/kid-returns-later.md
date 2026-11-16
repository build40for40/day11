# Kid returns later and continues the list

Result: pass

**system**
The same child tapped their wand again. The child's name is Lily. Their list still has 2 items: wooden building blocks, kite. Continue this same list up to 5.

**assistant**
Hello again, Lily! Wooden building blocks and kite are still on your list. What else do you love doing?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like drums.

**assistant**
Would you like a small drum you can tap?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Small drum is going on your list. That's three. What else do you love doing?
Tools: add_to_wishlist({"item":"small drum","reason":"You said you like music."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 3 items. Aim for 5.
