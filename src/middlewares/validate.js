/**
 * Middleware générique de validation avec un schéma Zod.
 * Échec : 400 VALIDATION_ERROR avec la liste des champs fautifs.
 * Succès : req.body est remplacé par les données validées (nettoyées).
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      details: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  req.body = result.data;
  next();
};
