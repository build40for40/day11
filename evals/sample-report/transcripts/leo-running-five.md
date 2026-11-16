# Leo likes running and moving

Result: pass

**system**
The child tapped their wand. The child's name is Leo. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Leo! I'm Aunty Bella. What's the best thing you've played with lately?
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

**kid**
I like balls.

**assistant**
Would you like a soft ball to roll and throw?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Soft ball is going on your list. That's two. What else do you love doing?
Tools: add_to_wishlist({"item":"soft ball","reason":"You said you like balls."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 2 items. Aim for 5.

**kid**
I like the garden.

**assistant**
Would you like a watering can for the garden?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Watering can is going on your list. That's three. Which one do you love most?
Tools: add_to_wishlist({"item":"watering can","reason":"You said you like the garden."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 3 items. Aim for 5.

**kid**
I like dancing.

**assistant**
Would you like a scarf for dancing?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Scarf for dancing is going on your list. That's four. What else do you love doing?
Tools: add_to_wishlist({"item":"scarf for dancing","reason":"You said you like dancing."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 4 items. Aim for 5.

**kid**
I like picnics.

**assistant**
Would you like a picnic blanket to sit on outside?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes!

**assistant**
Yes! Picnic blanket is going on your list. That's five. Leo, we did it! Five wonderful things are on your list. It's on its way to Mum. You were brilliant.
Tools: add_to_wishlist({"item":"picnic blanket","reason":"You said you like picnics."}), set_mood({"mood":"happy"}), set_leds({"color":"rainbow"})

**system**
Wishlist now has 5 items. Do the happy recap and say the list is on its way to Mum.
