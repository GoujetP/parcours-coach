import { ResponseModel } from "../../model/response.model";
import { StudentProfile } from "../../model/student-profile.model";

export interface AiGeneratorSpi {
  /**
   * Génère un contenu basé sur le profil étudiant
   * @param input - Données d'entrée
   * @returns Contenu généré
   */
  generate(input: StudentProfile): Promise<ResponseModel>;
}
