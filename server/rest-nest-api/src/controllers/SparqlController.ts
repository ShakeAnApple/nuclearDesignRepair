import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { VerificationService } from '../services/VerificationService';

export const editFileName = (req, file, callback) => {
  callback(null, file.originalname);
};

@Controller('sparql')
export class SparqlController {
  constructor(private verificationService: VerificationService) {}

  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/',
        filename: editFileName,
      }),
    }),
  )
  @Post('upload')
  upload(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    this.verificationService.RecordQueries(
      `${file.destination}${file.filename}`,
    );
  }
}
