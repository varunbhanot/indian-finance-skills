# A vesting schedule must account for the whole grant

Three years of 25% is a schedule describing three quarters of a grant. The
decoder refuses it with `vesting_schedule_not_whole` rather than assuming where
the fourth quarter went, because assuming is how a back-loaded grant becomes the
flat annual figure the decoder exists to take apart (ADR 0005).
