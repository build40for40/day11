# A duplicate item across sessions is merged

Result: pass

**system**
The same child tapped their wand again. The child's name is Lily. Their list still has 1 item: wooden building blocks. Continue this same list up to 5.

**assistant**
Hello again, Lily! Wooden building blocks is still on your list. What else do you love doing?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like blocks.

**assistant**
Would you like wooden building blocks you can build a castle with?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Wooden building blocks is already on your list. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden building blocks","reason":"You said you like blocks."}), set_mood({"mood":"thinking"})
