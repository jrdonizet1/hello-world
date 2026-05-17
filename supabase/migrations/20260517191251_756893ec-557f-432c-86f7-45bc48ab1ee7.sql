ALTER TABLE public.leaderboard 
ADD COLUMN score_color INTEGER DEFAULT 0,
ADD COLUMN score_math INTEGER DEFAULT 0,
ADD COLUMN score_general INTEGER DEFAULT 0,
ADD COLUMN score_curiosity INTEGER DEFAULT 0,
ADD COLUMN score_sequence INTEGER DEFAULT 0,
ADD COLUMN score_capital INTEGER DEFAULT 0,
ADD COLUMN score_scale INTEGER DEFAULT 0;

-- Indexing for performance
CREATE INDEX idx_leaderboard_score_color ON public.leaderboard(score_color DESC);
CREATE INDEX idx_leaderboard_score_math ON public.leaderboard(score_math DESC);
CREATE INDEX idx_leaderboard_score_general ON public.leaderboard(score_general DESC);
CREATE INDEX idx_leaderboard_score_curiosity ON public.leaderboard(score_curiosity DESC);
CREATE INDEX idx_leaderboard_score_sequence ON public.leaderboard(score_sequence DESC);
CREATE INDEX idx_leaderboard_score_capital ON public.leaderboard(score_capital DESC);
CREATE INDEX idx_leaderboard_score_scale ON public.leaderboard(score_scale DESC);